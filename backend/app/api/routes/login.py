from datetime import datetime, timedelta
from typing import Annotated, Any

from fastapi import APIRouter, BackgroundTasks, Depends, HTTPException, Request
from fastapi.responses import HTMLResponse
from fastapi.security import OAuth2PasswordRequestForm
from pydantic import BaseModel

from app import crud
from app.api.deps import CurrentUser, SessionDep, extract_client_ip, get_current_active_superuser
from app.core import security
from app.core.config import settings
from app.core.security import get_password_hash
from app.models import LoginLog, Message, NewPassword, Token, UserPublic
from app.utils import (
    generate_email_verification_token,
    generate_password_reset_token,
    generate_reset_password_email,
    generate_verification_email,
    send_email,
    verify_email_verification_token,
    verify_password_reset_token,
)

router = APIRouter(tags=["login"])


@router.post("/login/access-token")
def login_access_token(
    request: Request,
    session: SessionDep,
    form_data: Annotated[OAuth2PasswordRequestForm, Depends()],
) -> Token:
    """
    OAuth2 compatible token login, get an access token for future requests
    """
    ip = extract_client_ip(request)
    ua = request.headers.get("User-Agent", "")[:512]

    user = crud.authenticate(
        session=session, email=form_data.username, password=form_data.password
    )
    if not user:
        session.add(LoginLog(
            user_id=None,
            email_attempted=form_data.username[:255],
            ip_address=ip,
            user_agent=ua,
            success=False,
        ))
        session.commit()
        raise HTTPException(status_code=400, detail="Incorrect email or password")
    elif not user.is_active:
        session.add(LoginLog(
            user_id=user.id,
            email_attempted=form_data.username[:255],
            ip_address=ip,
            user_agent=ua,
            success=False,
        ))
        session.commit()
        raise HTTPException(
            status_code=400,
            detail="Your account is inactive. Please contact support at support@ROAMINGPROXY.com.",
        )

    session.add(LoginLog(
        user_id=user.id,
        email_attempted=form_data.username[:255],
        ip_address=ip,
        user_agent=ua,
        success=True,
    ))
    session.commit()

    access_token_expires = timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    return Token(
        access_token=security.create_access_token(
            user.id, expires_delta=access_token_expires
        )
    )


@router.post("/login/test-token", response_model=UserPublic)
def test_token(current_user: CurrentUser) -> Any:
    """
    Test access token
    """
    return current_user


@router.post("/password-recovery/{email}")
def recover_password(email: str, session: SessionDep) -> Message:
    """
    Password Recovery
    """
    user = crud.get_user_by_email(session=session, email=email)

    if not user:
        raise HTTPException(
            status_code=404,
            detail="The user with this email does not exist in the system.",
        )
    password_reset_token = generate_password_reset_token(email=email)
    email_data = generate_reset_password_email(
        email_to=user.email, email=email, token=password_reset_token
    )
    send_email(
        email_to=user.email,
        subject=email_data.subject,
        html_content=email_data.html_content,
    )
    return Message(message="Password recovery email sent")


@router.post("/reset-password/")
def reset_password(session: SessionDep, body: NewPassword) -> Message:
    """
    Reset password
    """
    email = verify_password_reset_token(token=body.token)
    if not email:
        raise HTTPException(status_code=400, detail="Invalid token")
    user = crud.get_user_by_email(session=session, email=email)
    if not user:
        raise HTTPException(
            status_code=404,
            detail="The user with this email does not exist in the system.",
        )
    elif not user.is_active:
        raise HTTPException(
            status_code=400,
            detail="Your account is inactive. Please contact support at support@ROAMINGPROXY.com.",
        )
    hashed_password = get_password_hash(password=body.new_password)
    user.hashed_password = hashed_password
    session.add(user)
    session.commit()
    return Message(message="Password updated successfully")


@router.post(
    "/password-recovery-html-content/{email}",
    dependencies=[Depends(get_current_active_superuser)],
    response_class=HTMLResponse,
)
def recover_password_html_content(email: str, session: SessionDep) -> Any:
    """
    HTML Content for Password Recovery
    """
    user = crud.get_user_by_email(session=session, email=email)

    if not user:
        raise HTTPException(
            status_code=404,
            detail="The user with this username does not exist in the system.",
        )
    password_reset_token = generate_password_reset_token(email=email)
    email_data = generate_reset_password_email(
        email_to=user.email, email=email, token=password_reset_token
    )

    return HTMLResponse(
        content=email_data.html_content, headers={"subject:": email_data.subject}
    )


class VerifyEmailRequest(BaseModel):
    token: str


@router.post("/verify-email")
def verify_email(session: SessionDep, body: VerifyEmailRequest) -> Message:
    """
    Confirm a user's email address using a verification token.
    """
    email = verify_email_verification_token(token=body.token)
    if not email:
        raise HTTPException(
            status_code=400, detail="Invalid or expired verification token"
        )
    user = crud.get_user_by_email(session=session, email=email)
    if not user:
        raise HTTPException(
            status_code=404,
            detail="The user with this email does not exist in the system.",
        )
    if user.email_verified_at is None:
        user.email_verified_at = datetime.utcnow()
        session.add(user)
        session.commit()
    return Message(message="Email verified successfully")


@router.post("/verify-email/resend")
def resend_verification_email(
    session: SessionDep,
    current_user: CurrentUser,
    background_tasks: BackgroundTasks,
) -> Message:
    """
    Resend the email verification link to the currently authenticated user.
    """
    if current_user.email_verified_at is not None:
        return Message(message="Email is already verified")
    token = generate_email_verification_token(email=current_user.email)
    email_data = generate_verification_email(
        email_to=current_user.email,
        token=token,
        username=current_user.full_name or current_user.email.split("@")[0],
    )
    background_tasks.add_task(
        send_email,
        email_to=current_user.email,
        subject=email_data.subject,
        html_content=email_data.html_content,
    )
    return Message(message="Verification email sent")
