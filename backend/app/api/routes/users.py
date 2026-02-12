import uuid
from typing import Any
from datetime import datetime, timedelta
import logging

from fastapi import APIRouter, Depends, HTTPException, BackgroundTasks
from sqlmodel import col, delete, func, select

from app import crud
from app.api.deps import (
    CurrentUser,
    SessionDep,
    get_current_active_superuser,
)
from app.core.config import settings
from app.core.security import get_password_hash, verify_password
from app.models import (
    Item,
    Message,
    UpdatePassword,
    User,
    UserCreate,
    UserPublic,
    UserRegister,
    UsersPublic,
    UserUpdate,
    UserUpdateMe,
)
from pydantic import BaseModel
from typing import Optional
from app.utils import generate_new_account_email, send_email

logging.basicConfig(level=logging.DEBUG)
logger = logging.getLogger(__name__)

router = APIRouter(prefix="/users", tags=["users"])

# Background task to check subscription expirations
def check_subscription_expirations(session: SessionDep):
    logger.debug("Starting check_subscription_expirations")
    users = session.exec(select(User)).all()
    for user in users:
        if user.has_subscription and user.expiry_date:
            if datetime.utcnow() > user.expiry_date:
                user.has_subscription = False
                user.expiry_date = None
                session.add(user)
    session.commit()
    logger.debug("Completed check_subscription_expirations")

@router.get(
    "/",
    dependencies=[Depends(get_current_active_superuser)],
    response_model=UsersPublic,
)
def read_users(session: SessionDep, skip: int = 0, limit: int = 100) -> Any:
    logger.debug(f"Reading users, skip={skip}, limit={limit}")
    count_statement = select(func.count()).select_from(User)
    count = session.exec(count_statement).one()
    statement = select(User).offset(skip).limit(limit)
    users = session.exec(statement).all()
    return UsersPublic(data=users, count=count)

@router.post(
    "/", 
    dependencies=[Depends(get_current_active_superuser)], 
    response_model=UserPublic
)
def create_user(
    *, 
    session: SessionDep, 
    user_in: UserCreate,
    background_tasks: BackgroundTasks
) -> Any:
    logger.debug(f"Creating user: {user_in.email}")
    user = crud.get_user_by_email(session=session, email=user_in.email)
    if user:
        logger.info(f"Email already exists: {user_in.email}")
        raise HTTPException(
            status_code=400,
            detail="The user with this email already exists in the system.",
        )

    user = crud.create_user(session=session, user_create=user_in, is_trial=user_in.is_trial)
    if settings.emails_enabled and user_in.email:
        logger.debug(f"Sending email to: {user_in.email}")
        email_data = generate_new_account_email(
            email_to=user_in.email, 
            username=user_in.email, 
            password=user_in.password
        )
        send_email(
            email_to=user_in.email,
            subject=email_data.subject, 
            html_content=email_data.html_content,
        )
    
    background_tasks.add_task(check_subscription_expirations, session)
    logger.debug(f"User created: {user.id}")
    return user

@router.patch("/me", response_model=UserPublic)
def update_user_me(
    *, 
    session: SessionDep, 
    user_in: UserUpdateMe, 
    current_user: CurrentUser
) -> Any:
    logger.debug(f"Updating user: {current_user.email}")
    if user_in.email:
        existing_user = crud.get_user_by_email(session=session, email=user_in.email)
        if existing_user and existing_user.id != current_user.id:
            logger.info(f"Email conflict: {user_in.email}")
            raise HTTPException(
                status_code=409, 
                detail="User with this email already exists"
            )
    user_data = user_in.model_dump(exclude_unset=True)
    current_user.sqlmodel_update(user_data)
    session.add(current_user)
    session.commit()
    session.refresh(current_user)
    logger.debug(f"User updated: {current_user.email}")
    return current_user

@router.patch("/me/password", response_model=Message)
def update_password_me(
    *,
    session: SessionDep,
    body: UpdatePassword,
    current_user: CurrentUser
) -> Any:
    logger.debug(f"Updating password for: {current_user.email}")
    if not verify_password(body.current_password, current_user.hashed_password):
        logger.info("Incorrect password")
        raise HTTPException(status_code=400, detail="Incorrect password")
    if body.current_password == body.new_password:
        logger.info("New password same as current")
        raise HTTPException(
            status_code=400,
            detail="New password cannot be the same as the current one"
        )
    hashed_password = get_password_hash(body.new_password)
    current_user.hashed_password = hashed_password
    session.add(current_user)
    session.commit()
    logger.debug("Password updated")
    return Message(message="Password updated successfully")


class UpdateAPIKeys(BaseModel):
    anthropic_api_key: Optional[str] = None
    openai_api_key: Optional[str] = None
    google_api_key: Optional[str] = None


@router.patch("/me/api-key", response_model=Message)
def update_api_keys(
    *,
    session: SessionDep,
    body: UpdateAPIKeys,
    current_user: CurrentUser
) -> Any:
    """Update user's LLM provider API keys"""
    logger.info(f"[API_KEY_UPDATE] User: {current_user.email}, Request body: anthropic={bool(body.anthropic_api_key)}, openai={bool(body.openai_api_key)}, google={bool(body.google_api_key)}")

    # Update only the keys that are provided
    if body.anthropic_api_key is not None:
        current_user.anthropic_api_key = body.anthropic_api_key if body.anthropic_api_key else None
        logger.info(f"[API_KEY_UPDATE] Set Anthropic API key for {current_user.email}")
    if body.openai_api_key is not None:
        current_user.openai_api_key = body.openai_api_key if body.openai_api_key else None
        logger.info(f"[API_KEY_UPDATE] Set OpenAI API key for {current_user.email}")
    if body.google_api_key is not None:
        current_user.google_api_key = body.google_api_key if body.google_api_key else None
        logger.info(f"[API_KEY_UPDATE] Set Google API key for {current_user.email}")

    session.add(current_user)
    session.commit()
    session.refresh(current_user)
    logger.info(f"[API_KEY_UPDATE] Successfully updated API keys for {current_user.email}")
    return Message(message="API keys updated successfully")


@router.delete("/me/api-key", response_model=Message)
def delete_api_keys(
    *,
    session: SessionDep,
    current_user: CurrentUser
) -> Any:
    """Delete all user's LLM provider API keys"""
    logger.debug(f"Deleting API keys for: {current_user.email}")

    current_user.anthropic_api_key = None
    current_user.openai_api_key = None
    current_user.google_api_key = None

    session.add(current_user)
    session.commit()
    logger.debug("API keys deleted")
    return Message(message="API keys removed successfully")


class APIKeyStatus(BaseModel):
    has_anthropic_key: bool
    has_openai_key: bool
    has_google_key: bool


@router.get("/me/api-key-status", response_model=APIKeyStatus)
def get_api_key_status(
    current_user: CurrentUser
) -> Any:
    """Get status of which API keys are configured (without exposing the actual keys)"""
    return APIKeyStatus(
        has_anthropic_key=bool(current_user.anthropic_api_key),
        has_openai_key=bool(current_user.openai_api_key),
        has_google_key=bool(current_user.google_api_key)
    )

@router.get("/me", response_model=UserPublic)
def read_user_me(current_user: CurrentUser) -> Any:
    logger.debug(f"Reading user: {current_user.email}")
    return current_user

@router.delete("/me", response_model=Message)
def delete_user_me(session: SessionDep, current_user: CurrentUser) -> Any:
    logger.debug(f"Deleting user: {current_user.email}")
    if current_user.is_superuser:
        logger.info("Superuser deletion attempted")
        raise HTTPException(
            status_code=403, 
            detail="Super users are not allowed to delete themselves"
        )
    statement = delete(Item).where(col(Item.owner_id) == current_user.id)
    session.exec(statement)
    session.delete(current_user)
    session.commit()
    logger.debug("User deleted")
    return Message(message="User deleted successfully")

@router.post("/signup", response_model=UserPublic)
def register_user(
    session: SessionDep, 
    user_in: UserRegister,
    background_tasks: BackgroundTasks
) -> Any:
    logger.debug(f"Signup request received: {user_in.dict()}")
    user = crud.get_user_by_email(session=session, email=user_in.email)
    if user:
        logger.info(f"Email already exists: {user_in.email}")
        raise HTTPException(
            status_code=400,
            detail="The user with this email already exists in the system",
        )
    logger.debug("Converting UserRegister to UserCreate")
    user_create = UserCreate.model_validate(user_in)
    logger.debug(f"Creating user: {user_create.dict()}")
    user = crud.create_user(session=session, user_create=user_create, is_trial=True)
    logger.debug(f"User created: {user.id}")
    background_tasks.add_task(check_subscription_expirations, session)
    logger.debug("Background task scheduled")
    return user

@router.get("/{user_id}", response_model=UserPublic)
def read_user_by_id(
    user_id: uuid.UUID, 
    session: SessionDep, 
    current_user: CurrentUser
) -> Any:
    logger.debug(f"Reading user by ID: {user_id}")
    user = session.get(User, user_id)
    if user == current_user:
        return user
    if not current_user.is_superuser:
        logger.info(f"Unauthorized access attempt by: {current_user.email}")
        raise HTTPException(
            status_code=403,
            detail="The user doesn't have enough privileges",
        )
    return user

@router.patch(
    "/{user_id}",
    dependencies=[Depends(get_current_active_superuser)],
    response_model=UserPublic,
)
def update_user(
    *,
    session: SessionDep,
    user_id: uuid.UUID,
    user_in: UserUpdate,
    background_tasks: BackgroundTasks
) -> Any:
    logger.debug(f"Starting update_user for user_id: {user_id}, input: {user_in.dict()}")
    db_user = session.get(User, user_id)
    if not db_user:
        logger.info(f"User {user_id} not found")
        raise HTTPException(
            status_code=404,
            detail="The user with this id does not exist in the system",
        )
    logger.debug(f"Found user: {db_user.id}")
    
    if user_in.email:
        existing_user = crud.get_user_by_email(session=session, email=user_in.email)
        if existing_user and existing_user.id != user_id:
            logger.info(f"Email conflict: {user_in.email}")
            raise HTTPException(
                status_code=409, 
                detail="User with this email already exists"
            )

    if user_in.is_trial and not db_user.expiry_date:
        db_user.expiry_date = datetime.utcnow() + timedelta(days=30)
        logger.debug(f"Set trial expiry: {db_user.expiry_date}")
    if user_in.has_subscription is False:
        db_user.expiry_date = None
        logger.debug("Cleared expiry date due to no subscription")

    logger.debug("Calling crud.update_user")
    db_user = crud.update_user(session=session, db_user=db_user, user_in=user_in)
    logger.debug("crud.update_user completed")
    
    background_tasks.add_task(check_subscription_expirations, session)
    return db_user

@router.delete("/{user_id}", dependencies=[Depends(get_current_active_superuser)])
def delete_user(
    session: SessionDep, 
    current_user: CurrentUser, 
    user_id: uuid.UUID
) -> Message:
    logger.debug(f"Deleting user: {user_id}")
    user = session.get(User, user_id)
    if not user:
        logger.info(f"User {user_id} not found")
        raise HTTPException(status_code=404, detail="User not found")
    if user == current_user:
        logger.info("Superuser deletion attempted")
        raise HTTPException(
            status_code=403, 
            detail="Super users are not allowed to delete themselves"
        )
    statement = delete(Item).where(col(Item.owner_id) == user_id)
    session.exec(statement)
    session.delete(user)
    session.commit()
    logger.debug("User deleted")
    return Message(message="User deleted successfully")