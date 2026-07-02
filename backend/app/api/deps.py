from collections.abc import Generator
from typing import Annotated, Optional
from datetime import datetime

import jwt
from fastapi import Depends, HTTPException, Request, status
from fastapi.security import OAuth2PasswordBearer
from jwt.exceptions import InvalidTokenError
from pydantic import ValidationError
from sqlmodel import Session, select

from app.core import security
from app.core.config import settings
from app.core.db import engine
from app.models import TokenPayload, User, UserApiKey, ApiRequestLog

reusable_oauth2 = OAuth2PasswordBearer(
    tokenUrl=f"{settings.API_V1_STR}/login/access-token"
)


def get_db() -> Generator[Session, None, None]:
    with Session(engine) as session:
        yield session


SessionDep = Annotated[Session, Depends(get_db)]
TokenDep = Annotated[str, Depends(reusable_oauth2)]


def extract_client_ip(request: Request) -> Optional[str]:
    """Extract real client IP, respecting reverse-proxy headers."""
    forwarded = request.headers.get("X-Forwarded-For")
    if forwarded:
        return forwarded.split(",")[0].strip()
    real_ip = request.headers.get("X-Real-IP")
    if real_ip:
        return real_ip.strip()
    return request.client.host if request.client else None


def get_current_user(session: SessionDep, token: TokenDep, request: Request) -> User:
    # Check if this is a product API key (rp_ prefix)
    if token.startswith("rp_"):
        ip = extract_client_ip(request)
        ua = request.headers.get("User-Agent", "")[:255]
        return _resolve_api_key(session, token, ip, ua)

    # Otherwise treat as JWT
    try:
        payload = jwt.decode(
            token, settings.SECRET_KEY, algorithms=[security.ALGORITHM]
        )
        token_data = TokenPayload(**payload)
    except (InvalidTokenError, ValidationError):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Could not validate credentials",
        )
    user = session.get(User, token_data.sub)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    if not user.is_active:
        raise HTTPException(status_code=400, detail="Inactive user")
    return user


def _resolve_api_key(session: Session, token: str, ip_address: Optional[str] = None, user_agent: Optional[str] = None) -> User:
    """Authenticate via product API key (rp_...) and log the request"""
    prefix = token[:10]
    statement = select(UserApiKey).where(
        UserApiKey.key_prefix == prefix,
        UserApiKey.is_active == True,
    )
    keys = session.exec(statement).all()

    for api_key in keys:
        if security.verify_password(token, api_key.hashed_key):
            from sqlmodel import update
            stmt = (
                update(UserApiKey)
                .where(UserApiKey.id == api_key.id)
                .values(
                    request_count=UserApiKey.request_count + 1,
                    last_used_at=datetime.utcnow(),
                    last_ip=ip_address,
                )
            )
            session.exec(stmt)

            # Write per-request evidence log
            session.add(ApiRequestLog(
                user_id=api_key.user_id,
                api_key_prefix=api_key.key_prefix,
                ip_address=ip_address,
                user_agent=user_agent,
            ))
            session.commit()

            user = session.get(User, api_key.user_id)
            if not user or not user.is_active:
                raise HTTPException(status_code=403, detail="User account is inactive")
            return user

    raise HTTPException(
        status_code=status.HTTP_403_FORBIDDEN,
        detail="Invalid API key",
    )


CurrentUser = Annotated[User, Depends(get_current_user)]


def get_auth_source(token: TokenDep) -> str:
    """Return 'api' if token is an rp_ API key, otherwise 'playground'."""
    if token.startswith("rp_"):
        return "api"
    return "playground"


AuthSource = Annotated[str, Depends(get_auth_source)]


def get_current_active_superuser(current_user: CurrentUser) -> User:
    if not current_user.is_superuser:
        raise HTTPException(
            status_code=403, detail="The user doesn't have enough privileges"
        )
    return current_user