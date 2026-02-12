from sqlalchemy import func
from sqlmodel import Session, create_engine, select

from app import crud
from app.core.config import settings
from app.models import User, UserCreate

# Configure connection pool for concurrent requests
# pool_size: number of connections to maintain
# max_overflow: additional connections when pool is exhausted
# pool_pre_ping: verify connections before using them
engine = create_engine(
    str(settings.SQLALCHEMY_DATABASE_URI),
    pool_size=20,
    max_overflow=40,
    pool_pre_ping=True,
    pool_recycle=3600,  # Recycle connections after 1 hour
)


def init_db(session: Session) -> None:
    user = session.exec(
        select(User.id, User.email, User.is_active, User.is_superuser)
        .where(func.lower(User.email) == settings.FIRST_SUPERUSER.lower())
    ).first()
    if not user:
        user_in = UserCreate(
            email=settings.FIRST_SUPERUSER,
            password=settings.FIRST_SUPERUSER_PASSWORD,
            is_superuser=True,
            
        )
        user = crud.create_user(session=session, user_create=user_in)
