import uuid
from typing import List, Optional, Any
from datetime import datetime, timedelta

from fastapi import HTTPException
from sqlalchemy.exc import IntegrityError
from sqlmodel import Session, select

from app.models import (
    UserAgent,
    UserAgentCreate,
    UserAgentUpdate,
    UserAgentPublic,
    UserAgentsPublic,
    User,
    UserCreate,
    UserUpdate,
    Item,
    ItemCreate
)
from app.core.security import get_password_hash, verify_password

def create_user_agent(session: Session, user_agent_create: UserAgentCreate) -> UserAgent:
    existing_ua = session.exec(
        select(UserAgent).where(UserAgent.user_agent == user_agent_create.user_agent)
    ).first()

    if existing_ua:
        existing_ua.percentage = user_agent_create.percentage
        session.add(existing_ua)
    else:
        db_user_agent = UserAgent.model_validate(user_agent_create)
        session.add(db_user_agent)

    try:
        session.commit()
        session.refresh(existing_ua if existing_ua else db_user_agent)
    except IntegrityError:
        session.rollback()
        raise HTTPException(status_code=409, detail="Duplicate user agent entry")

    return existing_ua if existing_ua else db_user_agent

def get_user_agent_by_id(session: Session, user_agent_id: uuid.UUID) -> Optional[UserAgent]:
    return session.get(UserAgent, user_agent_id)

def get_user_agent_by_string(session: Session, user_agent: str) -> Optional[UserAgent]:
    statement = select(UserAgent).where(UserAgent.user_agent == user_agent)
    return session.exec(statement).first()

def get_all_user_agents(session: Session, skip: int = 0, limit: int = 100) -> List[UserAgent]:
    statement = select(UserAgent).offset(skip).limit(limit)
    return session.exec(statement).all()

def update_user_agent(session: Session, db_user_agent: UserAgent, user_agent_in: UserAgentUpdate) -> UserAgent:
    user_agent_data = user_agent_in.model_dump(exclude_unset=True)
    for key, value in user_agent_data.items():
        setattr(db_user_agent, key, value)
    session.add(db_user_agent)
    session.commit()
    session.refresh(db_user_agent)
    return db_user_agent

def delete_user_agent(session: Session, user_agent_id: uuid.UUID) -> bool:
    db_user_agent = get_user_agent_by_id(session=session, user_agent_id=user_agent_id)
    if not db_user_agent:
        return False
    session.delete(db_user_agent)
    session.commit()
    return True

def create_user(session: Session, user_create: UserCreate, is_trial: bool = False) -> User:
    from app.services.stripe_utils import ensure_stripe_customer

    hashed_password = get_password_hash(user_create.password)
    db_obj = User(
        email=user_create.email,
        is_active=True,
        is_superuser=user_create.is_superuser,
        full_name=user_create.full_name,
        has_subscription=False,
        is_trial=is_trial,
        is_deactivated=False,
        hashed_password=hashed_password,
        id=uuid.uuid4(),
        expiry_date=datetime.utcnow() + timedelta(days=30) if is_trial else None
    )

    session.add(db_obj)
    session.flush()

    # Find existing Stripe customer by email or create a new one
    ensure_stripe_customer(
        db_obj,
        session,
        name=user_create.full_name or user_create.email.split("@")[0],
    )

    session.commit()
    session.refresh(db_obj)
    return db_obj

def update_user(session: Session, db_user: User, user_in: UserUpdate) -> User:
    user_data = user_in.model_dump(exclude_unset=True)
    
    if "password" in user_data:
        hashed_password = get_password_hash(user_data.pop("password"))
        user_data["hashed_password"] = hashed_password
    
    for key, value in user_data.items():
        setattr(db_user, key, value)
    session.add(db_user)
    session.commit()
    session.refresh(db_user)
    return db_user

def get_user_by_email(session: Session, email: str) -> Optional[User]:
    statement = select(User).where(User.email == email)
    return session.exec(statement).first()

def authenticate(session: Session, email: str, password: str) -> Optional[User]:
    db_user = get_user_by_email(session=session, email=email)
    if not db_user or not verify_password(password, db_user.hashed_password):
        return None
    return db_user

def create_item(session: Session, item_in: ItemCreate, owner_id: uuid.UUID) -> Item:
    db_item = Item.model_validate(item_in, update={"owner_id": owner_id})
    session.add(db_item)
    session.commit()
    session.refresh(db_item)
    return db_item