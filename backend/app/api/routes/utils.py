from fastapi import APIRouter, Depends
from pydantic.networks import EmailStr
from jinja2 import Environment, FileSystemLoader
from app.api.deps import get_current_active_superuser
from app.models import Message
from app.utils import generate_test_email, send_email
from app.core.config import settings

from fastapi import APIRouter, Depends, HTTPException, Request, BackgroundTasks
import logging

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/utils", tags=["utils"])

@router.post(
    "/test-email/",
    dependencies=[Depends(get_current_active_superuser)],
    status_code=201,
)
def test_email(email_to: EmailStr) -> Message:
    """
    Test emails.
    """
    email_data = generate_test_email(email_to=email_to)
    send_email(
        email_to=email_to,
        subject=email_data.subject,
        html_content=email_data.html_content,
    )
    return Message(message="Test email sent")

@router.get("/health-check/")
async def health_check() -> bool:
    return True

class EmailData:
    def __init__(self, html_content: str, subject: str):
        self.html_content = html_content
        self.subject = subject

def generate_activation_email(email_to: str, token: str, username: str = None) -> EmailData:
    logger.debug(f"Generating activation email for: {email_to}")
    project_name = settings.PROJECT_NAME
    subject = f"{project_name} - Activate Your Account"
    link = f"https://cloud.ROAMINGPROXY.com/activate?token={token}"
    valid_hours = settings.EMAIL_RESET_TOKEN_EXPIRE_HOURS

    # Set up Jinja2 environment
    env = Environment(loader=FileSystemLoader("app/templates/emails"))
    try:
        template = env.get_template("account_activation_email.html")
    except Exception as e:
        logger.error(f"Failed to load template account_activation_email.html for {email_to}: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail=f"Failed to load email template: {str(e)}"
        )

    # Render HTML with dynamic data
    try:
        html_content = template.render(
            project_name=project_name,
            username=username or email_to.split("@")[0],
            link=link,
            valid_hours=valid_hours
        )
    except Exception as e:
        logger.error(f"Failed to render template for {email_to}: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail=f"Failed to render email template: {str(e)}"
        )

    logger.debug(f"Successfully rendered activation email for: {email_to}")
    return EmailData(html_content=html_content, subject=subject)

def send_email(email_to: str, subject: str, html_content: str) -> None:
    # Existing send_email implementation (unchanged)
    pass