import secrets
import uuid
from typing import Any
from datetime import datetime

from fastapi import APIRouter, HTTPException
from sqlmodel import select, func

from app.api.deps import CurrentUser, SessionDep
from app.core.security import get_password_hash, verify_password
from app.models import (
    UserApiKey,
    UserApiKeyCreate,
    UserApiKeyCreated,
    UserApiKeyPublic,
    UserApiKeysPublic,
    Message,
)

router = APIRouter(prefix="/api-keys", tags=["api-keys"])


def generate_api_key() -> str:
    """Generate a secure API key with rp_ prefix"""
    raw = secrets.token_urlsafe(32)
    return f"rp_{raw}"


@router.post("/", response_model=UserApiKeyCreated)
def create_api_key(
    *,
    session: SessionDep,
    current_user: CurrentUser,
    body: UserApiKeyCreate,
) -> Any:
    """Create a new API key. The full key is only returned once."""
    full_key = generate_api_key()
    key_prefix = full_key[:10]
    hashed = get_password_hash(full_key)

    api_key = UserApiKey(
        user_id=current_user.id,
        name=body.name,
        key_prefix=key_prefix,
        hashed_key=hashed,
    )
    session.add(api_key)
    session.commit()
    session.refresh(api_key)

    return UserApiKeyCreated(
        id=api_key.id,
        name=api_key.name,
        key_prefix=api_key.key_prefix,
        request_count=api_key.request_count,
        last_used_at=api_key.last_used_at,
        is_active=api_key.is_active,
        created_at=api_key.created_at,
        full_key=full_key,
    )


@router.get("/", response_model=UserApiKeysPublic)
def list_api_keys(
    session: SessionDep,
    current_user: CurrentUser,
) -> Any:
    """List all API keys for the current user"""
    statement = (
        select(UserApiKey)
        .where(UserApiKey.user_id == current_user.id)
        .order_by(UserApiKey.created_at.desc())
    )
    keys = session.exec(statement).all()
    return UserApiKeysPublic(data=keys, count=len(keys))


@router.patch("/{key_id}/toggle", response_model=UserApiKeyPublic)
def toggle_api_key(
    *,
    session: SessionDep,
    current_user: CurrentUser,
    key_id: uuid.UUID,
) -> Any:
    """Enable or disable an API key"""
    api_key = session.get(UserApiKey, key_id)
    if not api_key or api_key.user_id != current_user.id:
        raise HTTPException(status_code=404, detail="API key not found")

    api_key.is_active = not api_key.is_active
    session.add(api_key)
    session.commit()
    session.refresh(api_key)
    return api_key


@router.delete("/{key_id}", response_model=Message)
def delete_api_key(
    *,
    session: SessionDep,
    current_user: CurrentUser,
    key_id: uuid.UUID,
) -> Any:
    """Delete an API key. Cannot delete keys with more than 0 requests."""
    api_key = session.get(UserApiKey, key_id)
    if not api_key or api_key.user_id != current_user.id:
        raise HTTPException(status_code=404, detail="API key not found")

    if api_key.request_count > 0:
        raise HTTPException(
            status_code=409,
            detail=f"Cannot delete API key with {api_key.request_count} logged requests. Disable it instead.",
        )

    session.delete(api_key)
    session.commit()
    return Message(message="API key deleted successfully")
