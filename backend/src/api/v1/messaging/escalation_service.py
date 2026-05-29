import logging
from sqlalchemy.ext.asyncio import AsyncSession
from db.models import Escalation, User
from .email_service import send_escalation_alert
from twilio.rest import Client

logger = logging.getLogger(__name__)

async def trigger_escalation_alert(db: AsyncSession, escalation: Escalation, user: User):
    """
    Trigger both email and WhatsApp alerts to the business owner when an escalation is created.
    """
    logger.info(f"Triggering escalation alerts for escalation {escalation.id} to user {user.id}")
    
    # 1. Send Email
    if user.email:
        import asyncio
        asyncio.create_task(send_escalation_alert(user.email, escalation.customer_name, escalation.issue_type))
        
    # 2. Send WhatsApp via Twilio (if Sandbox is configured)
    if user.twilio_account_sid and user.twilio_auth_token and user.twilio_phone_number and user.phone:
        try:
            client = Client(user.twilio_account_sid, user.twilio_auth_token)
            
            # Format destination number to ensure it starts with whatsapp:
            to_number = user.phone
            if not to_number.startswith("whatsapp:"):
                # assume it's just the number, needs whatsapp: prefix
                if not to_number.startswith("+"):
                    to_number = "+" + to_number
                to_number = f"whatsapp:{to_number}"
                
            from_number = user.twilio_phone_number
            if not from_number.startswith("whatsapp:"):
                from_number = f"whatsapp:{from_number}"
                
            msg_body = f"⚠️ *URGENT: New AI Escalation*\n\nYour AI Assistant escalated an issue.\n\n*Customer:* {escalation.customer_name}\n*Issue:* {escalation.issue_type}\n*Channel:* {escalation.channel}\n\nPlease check your Mancrel Dashboard Inbox immediately."
            
            message = client.messages.create(
                from_=from_number,
                body=msg_body,
                to=to_number
            )
            logger.info(f"Sent WhatsApp escalation alert: {message.sid}")
        except Exception as e:
            logger.error(f"Failed to send WhatsApp escalation alert: {e}")
    else:
        logger.warning(f"User {user.id} does not have Twilio credentials or a phone number set up. Skipping WhatsApp alert.")
