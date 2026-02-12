from collections.abc import Generator
from typing import Annotated
from datetime import datetime

import jwt
from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from jwt.exceptions import InvalidTokenError
from pydantic import ValidationError
from sqlmodel import Session, select

from app.core import security
from app.core.config import settings
from app.core.db import engine
from app.models import TokenPayload, User, UserApiKey

reusable_oauth2 = OAuth2PasswordBearer(
    tokenUrl=f"{settings.API_V1_STR}/login/access-token"
)


def get_db() -> Generator[Session, None, None]:
    with Session(engine) as session:
        yield session


SessionDep = Annotated[Session, Depends(get_db)]
TokenDep = Annotated[str, Depends(reusable_oauth2)]


def get_current_user(session: SessionDep, token: TokenDep) -> User:
    # Check if this is a product API key (rp_ prefix)
    if token.startswith("rp_"):
        return _resolve_api_key(session, token)

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


def _resolve_api_key(session: Session, token: str) -> User:
    """Authenticate via product API key (rp_...) and log the request"""
    prefix = token[:10]
    statement = select(UserApiKey).where(
        UserApiKey.key_prefix == prefix,
        UserApiKey.is_active == True,
    )
    keys = session.exec(statement).all()

    for api_key in keys:
        if security.verify_password(token, api_key.hashed_key):
            # Increment request count using SQL UPDATE to avoid race conditions
            # This ensures accurate counting under concurrent load
            from sqlmodel import update
            stmt = (
                update(UserApiKey)
                .where(UserApiKey.id == api_key.id)
                .values(
                    request_count=UserApiKey.request_count + 1,
                    last_used_at=datetime.utcnow()
                )
            )
            session.exec(stmt)
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