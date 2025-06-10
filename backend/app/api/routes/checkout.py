from fastapi import APIRouter, Depends, HTTPException, Request, BackgroundTasks
from fastapi.responses import JSONResponse
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.orm import Session
from typing import Annotated, Optional, Any
from pydantic import BaseModel, EmailStr, Field, validator
from datetime import datetime, timedelta
import uuid
import secrets
import logging
import stripe
import os
from jinja2 import Environment, FileSystemLoader
from tenacity import retry, stop_after_attempt, wait_exponential

from app.models import User, Message, Token, UserPublic, NewPassword
from app.api.deps import get_db, get_current_user, get_current_active_superuser, CurrentUser, SessionDep
from app.core.security import create_access_token, get_password_hash, verify_access_token
from app.core.config import settings
from app import crud
import emails

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Stripe configuration
stripe.api_key = os.getenv("STRIPE_SECRET_KEY")
webhook_secret = os.getenv("STRIPE_WEBHOOK_SECRET")
stripe.api_version = "2023-10-16"

# Create router
router = APIRouter(tags=["auth", "webhook"])

# Models
class ActivateRequest(BaseModel):
    token: str
    new_password: str = Field(min_length=8, max_length=40)

    @validator("new_password")
    def validate_password(cls, v):
        if not any(c.isupper() for c in v):
            raise ValueError("Password must contain at least one uppercase letter")
        if not any(c.isdigit() for c in v):
            raise ValueError("Password must contain at least one digit")
        if not any(c in "!@#$%^&*()" for c in v):
            raise ValueError("Password must contain at least one special character")
        return v

class EmailData:
    def __init__(self, html_content: str, subject: str):
        self.html_content = html_content
        self.subject = subject

# Email utilities
@retry(stop=stop_after_attempt(3), wait=wait_exponential(multiplier=1, min=4, max=10))
def send_email_with_retry(email_to: str, subject: str, html_content: str) -> bool:
    result = send_email(email_to=email_to, subject=subject, html_content=html_content)
    if not result:
        raise Exception(f"Email sending failed for {email_to}")
    return result

def send_email(*, email_to: str, subject: str = "", html_content: str = "") -> bool:
    try:
        if not settings.emails_enabled:
            logger.warning("Email sending is disabled in settings")
            return False
        
        message = emails.Message(
            subject=subject,
            html=html_content,
            mail_from=(settings.EMAILS_FROM_NAME, settings.EMAILS_FROM_EMAIL),
        )
        
        smtp_options = {"host": settings.SMTP_HOST, "port": settings.SMTP_PORT}
        if settings.SMTP_TLS:
            smtp_options["tls"] = True
        elif settings.SMTP_SSL:
            smtp_options["ssl"] = True
        if settings.SMTP_USER:
            smtp_options["user"] = settings.SMTP_USER
        if settings.SMTP_PASSWORD:
            smtp_options["password"] = settings.SMTP_PASSWORD
        
        response = message.send(to=email_to, smtp=smtp_options)
        
        logger.info(f"Email response for {email_to}: status_code={response.status_code}, "
                   f"status_text={response.status_text}, "
                   f"error={getattr(response, 'error', 'None')}")
        
        if response.status_code and 200 <= response.status_code < 300:
            return True
        else:
            logger.error(f"Failed to send email to {email_to}: Status code {response.status_code}")
            return False
    except Exception as e:
        logger.error(f"Exception sending email to {email_to}: {str(e)}")
        return False

def generate_activation_email(email_to: str, token: str, username: str = None) -> EmailData:
    logger.debug(f"Generating activation email for: {email_to}")
    project_name = settings.PROJECT_NAME
    subject = f"{project_name} - Activate Your Account"
    link = f"https://cloud.roamingproxy.com/activate?token={token}"
    valid_hours = settings.EMAIL_RESET_TOKEN_EXPIRE_HOURS

    # Set up Jinja2 environment
    template_path = "app/templates/emails"
    logger.debug(f"Current working directory: {os.getcwd()}")
    logger.debug(f"Loading template from: {template_path}")
    env = Environment(loader=FileSystemLoader(template_path))
    try:
        template = env.get_template("account_activation_email.html")
        html_content = template.render(
            project_name=project_name,
            username=username or email_to.split("@")[0],
            link=link,
            valid_hours=valid_hours
        )
    except Exception as e:
        logger.error(f"Failed to load or render template for {email_to}: {str(e)}")
        # Fallback HTML content
        html_content = f"""
        <h1>Welcome to {project_name}, {username or email_to.split("@")[0]}!</h1>
        <p>Please activate your account by clicking <a href="{link}">here</a>.</p>
        <p>Link: {link}</p>
        <p>This link expires in {valid_hours} hours.</p>
        <p>Ignore this email if you did not sign up.</p>
        """
        logger.warning(f"Using fallback HTML for activation email to {email_to}")

    logger.debug(f"Successfully generated activation email for: {email_to}")
    return EmailData(html_content=html_content, subject=subject)

def generate_password_reset_email(email_to: str, email: str, token: str) -> EmailData:
    logger.debug(f"Generating password reset email for: {email_to}")
    project_name = settings.PROJECT_NAME
    subject = f"{project_name} - Password Reset"
    link = f"https://cloud.roamingproxy.com/reset-password?token={token}"
    valid_hours = settings.EMAIL_RESET_TOKEN_EXPIRE_HOURS

    template_path = "app/templates/emails"
    env = Environment(loader=FileSystemLoader(template_path))
    try:
        template = env.get_template("password_reset_email.html")
        html_content = template.render(
            project_name=project_name,
            username=email_to.split("@")[0],
            link=link,
            valid_hours=valid_hours
        )
    except Exception as e:
        logger.error(f"Failed to load or render password reset template for {email_to}: {str(e)}")
        html_content = f"""
        <h1>Password Reset for {project_name}</h1>
        <p>Click <a href="{link}">here</a> to reset your password.</p>
        <p>Link: {link}</p>
        <p>This link expires in {valid_hours} hours.</p>
        """
        logger.warning(f"Using fallback HTML for password reset email to {email_to}")

    return EmailData(html_content=html_content, subject=subject)

# User creation
async def create_user_if_not_exists(
    db: Session,
    email: str,
    customer_id: Optional[str] = None,
    subscription_id: Optional[str] = None,
    background_tasks: BackgroundTasks = None
):
    user = db.query(User).filter(User.email == email).first()
    if user:
        logger.info(f"User already exists: {email}")
        return user
    
    user_id = str(uuid.uuid4())
    temporary_password = secrets.token_urlsafe(12)
    user = User(
        id=user_id,
        email=email,
        full_name="New User",
        hashed_password=get_password_hash(temporary_password),
        is_active=False,
        stripe_customer_id=customer_id,
        subscription_id=subscription_id
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    logger.info(f"Created new user: {email}")
    
    if background_tasks:
        try:
            activation_token = create_access_token(
                subject=user_id,
                expires_delta=timedelta(hours=settings.EMAIL_RESET_TOKEN_EXPIRE_HOURS)
            )
            email_data = generate_activation_email(
                email_to=email,
                token=activation_token,
                username=user.full_name or email
            )
            background_tasks.add_task(
                send_email_with_retry,
                email_to=email,
                subject=email_data.subject,
                html_content=email_data.html_content
            )
            logger.info(f"Scheduled activation email for: {email}")
        except Exception as e:
            logger.error(f"Failed to generate or schedule activation email for {email}: {str(e)}")
            raise
    
    return user

# Authentication routes
@router.post("/login/access-token")
def login_access_token(
    session: SessionDep,
    form_data: Annotated[OAuth2PasswordRequestForm, Depends()]
) -> Token:
    user = crud.authenticate(
        session=session, email=form_data.username, password=form_data.password
    )
    if not user:
        raise HTTPException(status_code=400, detail="Incorrect email or password")
    elif not user.is_active:
        raise HTTPException(status_code=400, detail="Inactive user")
    access_token_expires = timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    return Token(
        access_token=create_access_token(
            user.id, expires_delta=access_token_expires
        )
    )

@router.post("/login/test-token", response_model=UserPublic)
def test_token(current_user: CurrentUser) -> Any:
    return current_user

@router.post("/password-recovery/{email}")
def recover_password(email: str, session: SessionDep, background_tasks: BackgroundTasks) -> Message:
    user = crud.get_user_by_email(session=session, email=email)
    if not user:
        raise HTTPException(
            status_code=404,
            detail="The user with this email does not exist in the system.",
        )
    password_reset_token = create_access_token(
        subject=email,
        expires_delta=timedelta(hours=settings.EMAIL_RESET_TOKEN_EXPIRE_HOURS)
    )
    email_data = generate_password_reset_email(
        email_to=user.email, email=email, token=password_reset_token
    )
    background_tasks.add_task(
        send_email_with_retry,
        email_to=user.email,
        subject=email_data.subject,
        html_content=email_data.html_content,
    )
    return Message(message="Password recovery email sent")

@router.post("/reset-password/")
def reset_password(session: SessionDep, body: NewPassword) -> Message:
    email = verify_access_token(token=body.token)
    if not email:
        raise HTTPException(status_code=400, detail="Invalid token")
    user = crud.get_user_by_email(session=session, email=email)
    if not user:
        raise HTTPException(
            status_code=404,
            detail="The user with this email does not exist in the system.",
        )
    elif not user.is_active:
        raise HTTPException(status_code=400, detail="Inactive user")
    hashed_password = get_password_hash(password=body.new_password)
    user.hashed_password = hashed_password
    session.add(user)
    session.commit()
    return Message(message="Password updated successfully")

@router.post("/activate")
async def activate_account(request: ActivateRequest, db: Annotated[Session, Depends(get_db)]):
    user_id = verify_access_token(request.token)
    if not user_id:
        logger.error(f"Invalid or expired activation token: {request.token[:10]}...")
        raise HTTPException(status_code=400, detail="Invalid or expired activation token")
    
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        logger.error(f"User not found for ID: {user_id}")
        raise HTTPException(status_code=404, detail="User not found")
    
    if user.is_active:
        logger.info(f"Account already activated for user: {user.email}")
        return {"message": "Account already activated"}
    
    user.hashed_password = get_password_hash(request.new_password)
    user.is_active = True
    db.commit()
    logger.info(f"Account activated successfully for user: {user.email}")
    return {"message": "Account activated successfully"}

@router.get("/customer-portal")
async def create_customer_portal(
    request: Request,
    current_user: Annotated[User, Depends(get_current_user)]
):
    if not current_user.stripe_customer_id:
        logger.warning(f"No Stripe customer ID for user: {current_user.email}")
        raise HTTPException(status_code=404, detail="No Stripe customer associated with this user")
    
    try:
        portal_session = stripe.billing_portal.Session.create(
            customer=current_user.stripe_customer_id,
            return_url="https://cloud.roamingproxy.com"
        )
        logger.info(f"Created customer portal session for user: {current_user.email}")
        return {"portal_url": portal_session.url}
    except stripe.error.StripeError as e:
        logger.error(f"Stripe error creating customer portal for {current_user.email}: {str(e)}")
        raise HTTPException(status_code=400, detail=f"Failed to create customer portal: {str(e)}")

# Webhook handler
@router.post("/stripe/webhook")
async def stripe_webhook(request: Request, background_tasks: BackgroundTasks, db: Annotated[Session, Depends(get_db)]):
    correlation_id = str(uuid.uuid4())
    logger.info(f"Webhook request started [correlation_id={correlation_id}]")
    
    signature = request.headers.get("stripe-signature")
    if not signature:
        logger.error(f"Missing Stripe signature [correlation_id={correlation_id}]")
        raise HTTPException(status_code=400, detail="Missing Stripe signature")
    
    payload = await request.body()
    
    try:
        event = stripe.Webhook.construct_event(payload, signature, webhook_secret)
    except (ValueError, stripe.error.SignatureVerificationError) as e:
        logger.error(f"Invalid webhook signature: {str(e)} [correlation_id={correlation_id}]")
        raise HTTPException(status_code=400, detail=f"Invalid webhook signature: {str(e)}")
    
    event_type = event.get("type")
    logger.info(f"Processing Stripe webhook event: {event_type} [correlation_id={correlation_id}]")
    
    if event_type == "checkout.session.completed":
        session = event.data.object
        customer_id = session.get("customer")
        subscription_id = session.get("subscription")
        email = session.metadata.get("email") or session.get("customer_details", {}).get("email")
        
        logger.info(f"Checkout completed: customer={customer_id}, subscription={subscription_id}, email={email} [correlation_id={correlation_id}]")
        
        if email:
            try:
                user = await create_user_if_not_exists(
                    db=db,
                    email=email,
                    customer_id=customer_id,
                    subscription_id=subscription_id,
                    background_tasks=background_tasks
                )
                if subscription_id:
                    subscription = stripe.Subscription.retrieve(
                        subscription_id,
                        expand=["plan.product"]
                    )
                    background_tasks.add_task(
                        update_user_subscription,
                        db=db,
                        stripe_customer_id=customer_id,
                        subscription_data=subscription
                    )
            except Exception as e:
                logger.error(f"Error processing checkout.session.completed: {str(e)} [correlation_id={correlation_id}]")
                raise HTTPException(status_code=500, detail=str(e))
    
    elif event_type == "charge.succeeded":
        charge = event.data.object
        customer_id = charge.get("customer")
        email = charge.get("billing_details", {}).get("email")
        charge_id = charge.get("id")
        amount = charge.get("amount") / 100.0
        currency = charge.get("currency")
        
        logger.info(f"Charge succeeded: customer={customer_id}, charge={charge_id}, email={email}, amount={amount} {currency} [correlation_id={correlation_id}]")
        
        if email:
            try:
                await create_user_if_not_exists(
                    db=db,
                    email=email,
                    customer_id=customer_id,
                    background_tasks=background_tasks
                )
            except Exception as e:
                logger.error(f"Error processing charge.succeeded: {str(e)} [correlation_id={correlation_id}]")
                raise HTTPException(status_code=500, detail=str(e))
    
    elif event_type in ["product.created", "product.updated", "price.created"]:
        data = event.data.object
        product_id = data.get("id")
        logger.info(f"Processing {event_type}: product/price={product_id} [correlation_id={correlation_id}]")
        
        try:
            subscriptions = stripe.Subscription.list(
                limit=10,
                expand=["data.customer"]
            )
            for sub in subscriptions.data:
                if sub.plan.product == product_id:
                    email = sub.customer.email
                    customer_id = sub.customer.id
                    subscription_id = sub.id
                    if email:
                        user = await create_user_if_not_exists(
                            db=db,
                            email=email,
                            customer_id=customer_id,
                            subscription_id=subscription_id,
                            background_tasks=background_tasks
                        )
                        background_tasks.add_task(
                            update_user_subscription,
                            db=db,
                            stripe_customer_id=customer_id,
                            subscription_data=sub
                        )
                        break
        except stripe.error.StripeError as e:
            logger.error(f"Error retrieving subscriptions for product: {str(e)} [correlation_id={correlation_id}]")
            raise HTTPException(status_code=500, detail=str(e))
    
    elif event_type.startswith("customer.subscription."):
        subscription_data = event.data.object
        customer_id = subscription_data.get("customer")
        email = None
        try:
            customer = stripe.Customer.retrieve(customer_id)
            email = customer.get("email")
        except stripe.error.StripeError as e:
            logger.error(f"Error retrieving customer: {str(e)} [correlation_id={correlation_id}]")
        
        log_data = {
            "event_type": event_type,
            "subscription_id": subscription_data.get("id"),
            "customer_id": customer_id,
            "status": subscription_data.get("status"),
            "plan_id": subscription_data.get("plan", {}).get("id"),
        }
        logger.info(f"Subscription event details: {log_data} [correlation_id={correlation_id}]")
        
        if email:
            user = await create_user_if_not_exists(
                db=db,
                email=email,
                customer_id=customer_id,
                subscription_id=subscription_data.get("id"),
                background_tasks=background_tasks
            )
            background_tasks.add_task(
                update_user_subscription,
                db=db,
                stripe_customer_id=customer_id,
                subscription_data=subscription_data
            )
    
    elif event_type == "customer.deleted":
        customer_data = event.data.object
        customer_id = customer_data.get("id")
        
        try:
            user = db.query(User).filter(User.stripe_customer_id == customer_id).first()
            if user:
                logger.info(f"Customer deleted: {customer_id} for user: {user.email} [correlation_id={correlation_id}]")
                user.has_subscription = False
                user.is_trial = False
                user.is_deactivated = True
                user.subscription_id = None
                user.subscription_plan_id = None
                user.subscription_plan_name = None
                user.has_proxy_api_access = False
                db.commit()
        except Exception as e:
            logger.error(f"Error processing customer.deleted event: {str(e)} [correlation_id={correlation_id}]")
            db.rollback()
            raise HTTPException(status_code=500, detail=str(e))
    
    logger.info(f"Webhook request completed [correlation_id={correlation_id}]")
    return {"status": "success", "event_type": event_type}

# Subscription update
async def update_user_subscription(db: Session, stripe_customer_id: str, subscription_data: dict):
    try:
        user = db.query(User).filter(User.stripe_customer_id == stripe_customer_id).first()
        if not user:
            logger.warning(f"No user found with Stripe customer ID: {stripe_customer_id}")
            return
        
        logger.info(f"Updating subscription for user: {user.email}")
        
        status = subscription_data.get("status", "")
        metadata = {}
        if subscription_data.get("plan") and subscription_data["plan"].get("product"):
            product_id = subscription_data["plan"].get("product")
            try:
                product = stripe.Product.retrieve(product_id)
                if hasattr(product, "metadata"):
                    metadata = product.metadata
            except Exception as e:
                logger.error(f"Error retrieving product metadata: {str(e)}")
        
        user.subscription_id = subscription_data.get("id")
        user.has_subscription = status in ["active", "trialing", "past_due"]
        user.is_trial = status == "trialing"
        user.is_deactivated = status in ["canceled", "unpaid", "incomplete_expired"]
        
        if subscription_data.get("plan"):
            user.subscription_plan_id = subscription_data["plan"].get("id")
            user.subscription_plan_name = subscription_data["plan"].get("nickname")
        
        if subscription_data.get("current_period_start"):
            user.subscription_start = datetime.fromtimestamp(subscription_data["current_period_start"])
        if subscription_data.get("current_period_end"):
            user.subscription_end = datetime.fromtimestamp(subscription_data["current_period_end"])
        
        user.has_proxy_api_access = metadata.get("proxy-api") == "true"
        
        db.commit()
        logger.info(f"Successfully updated subscription for user: {user.email}")
    except Exception as e:
        logger.error(f"Error updating user subscription: {str(e)}")
        db.rollback()

# Test endpoint for activation email
@router.post("/test-activation-email")
async def test_activation_email(email: EmailStr, background_tasks: BackgroundTasks):
    token = create_access_token(subject="test-user", expires_delta=timedelta(hours=24))
    email_data = generate_activation_email(email_to=email, token=token, username="Test User")
    background_tasks.add_task(
        send_email_with_retry,
        email_to=email,
        subject=email_data.subject,
        html_content=email_data.html_content
    )
    return {"message": "Test activation email scheduled"}