import os
import logging
from fastapi_mail import FastMail, MessageSchema, ConnectionConfig, MessageType
from pydantic import EmailStr

logger = logging.getLogger(__name__)

def get_email_config():
    return ConnectionConfig(
        MAIL_USERNAME=os.environ.get("MAIL_USERNAME", ""),
        MAIL_PASSWORD=os.environ.get("MAIL_PASSWORD", ""),
        MAIL_FROM=os.environ.get("MAIL_FROM", "noreply@mancrel.app"),
        MAIL_PORT=int(os.environ.get("MAIL_PORT", 587)),
        MAIL_SERVER=os.environ.get("MAIL_SERVER", "smtp.gmail.com"),
        MAIL_STARTTLS=True,
        MAIL_SSL_TLS=False,
        USE_CREDENTIALS=True,
        VALIDATE_CERTS=True
    )

async def send_email_confirmation(email: EmailStr, name: str, token: str):
    """Send an email confirmation link upon signup."""
    if not os.environ.get("MAIL_USERNAME"):
        logger.warning(f"Email not configured. Skipping confirmation email to {email}. Token: {token}")
        return

    html = f"""
    <h2>Welcome to Mancrel, {name}!</h2>
    <p>Please click the link below to confirm your email address and activate your account:</p>
    <a href="https://mancrel.onrender.com/api/v1/auth/confirm-email?token={token}">Confirm Email</a>
    <p>If you did not sign up for Mancrel, please ignore this email.</p>
    """
    
    message = MessageSchema(
        subject="Confirm your Mancrel account",
        recipients=[email],
        body=html,
        subtype=MessageType.html
    )
    
    try:
        fm = FastMail(get_email_config())
        await fm.send_message(message)
    except Exception as e:
        logger.error(f"Failed to send confirmation email: {e}")

async def send_escalation_alert(email: EmailStr, customer_name: str, issue_type: str):
    """Send an urgent email to the business owner when an AI escalation occurs."""
    if not os.environ.get("MAIL_USERNAME"):
        logger.warning(f"Email not configured. Skipping escalation alert to {email}.")
        return

    html = f"""
    <h2>Urgent: New AI Escalation</h2>
    <p>Your AI Assistant has escalated an issue that requires your attention.</p>
    <ul>
        <li><strong>Customer:</strong> {customer_name}</li>
        <li><strong>Issue Type:</strong> {issue_type}</li>
    </ul>
    <p>Please log into your Mancrel Dashboard to view the Inbox and take over the conversation.</p>
    <a href="https://mancrel.vercel.app/dashboard">Go to Dashboard</a>
    """
    
    message = MessageSchema(
        subject=f"URGENT: Escalation from {customer_name}",
        recipients=[email],
        body=html,
        subtype=MessageType.html
    )
    
    try:
        fm = FastMail(get_email_config())
        await fm.send_message(message)
    except Exception as e:
        logger.error(f"Failed to send escalation email: {e}")
