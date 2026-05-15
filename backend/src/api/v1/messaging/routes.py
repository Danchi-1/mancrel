"""
api/v1/messaging/routes.py
==========================
FastAPI router for the /api/v1/messaging group of endpoints.

This file only handles HTTP concerns:
  - What URL does this endpoint live at?
  - What HTTP method? (GET, POST, ...)
  - What does the request body look like?
  - What status code does a success return?
  - What does the response schema look like?

All actual logic lives in controllers.py.  Routes are intentionally thin.

Endpoints
---------
  POST /api/v1/messaging/classify
    Body:    {"message": "Good morning"}
    Returns: {"message": "...", "label": "polite_greeting"}

  POST /api/v1/messaging/reply
    Body:    {"message": "...", "catalogue_items": [...], ...}
    Returns: {"reply": "...", "confidence": 1.0, "model_used": "...", "label": "..."}

  POST /api/v1/messaging/webhook
    Body:    Twilio form fields (From, Body, ...)
    Returns: 200 OK  (Twilio ignores the response body)
"""

from __future__ import annotations

import logging

from fastapi import APIRouter, Form, HTTPException, status, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select

from db.session import get_db
from db.models import Message
from api.v1.auth.deps import get_current_user

from .controllers import handle_classify, handle_reply, handle_twilio_webhook
from .schemas import ClassifyRequest, ClassifyResponse, ReplyRequest, ReplyResponse, WebhookResponse

logger = logging.getLogger(__name__)

# prefix="/messaging" means every route here starts with /messaging.
# The full path becomes /api/v1/messaging/... once the router is mounted
# in main.py with prefix="/api/v1".
router = APIRouter(
    prefix="/messaging",
    tags=["Messaging"],  # groups these endpoints under "Messaging" in the Swagger UI
)

@router.get("/inbox")
async def get_inbox(db: AsyncSession = Depends(get_db), current_user = Depends(get_current_user)):
    stmt = select(Message).order_by(Message.created_at.desc())
    result = await db.execute(stmt)
    messages = result.scalars().all()
    
    # Format for frontend AIInbox.jsx
    formatted = []
    for msg in messages:
        formatted.append({
            "id": msg.id,
            "from": msg.from_name or "Unknown",
            "company": msg.company or "Unknown Company",
            "subject": msg.subject or "Message",
            "preview": msg.preview or msg.full_text[:50],
            "time": msg.time or msg.created_at.strftime("%I:%M %p"),
            "unread": msg.unread,
            "sentiment": msg.sentiment,
            "aiSuggestion": {
                "confidence": msg.ai_suggestion_confidence or 0,
                "text": msg.ai_suggestion_text or "No suggestion"
            }
        })
    return formatted


@router.post(
    "/classify",
    response_model=ClassifyResponse,
    status_code=status.HTTP_200_OK,
    summary="Classify a customer message",
    description=(
        "Returns the intent label for an incoming message using the local "
        "SetFit classifier.  Labels: polite_greeting | sales_intent | "
        "support_issue | irrelevant_or_inappropriate."
    ),
)
async def classify_endpoint(request: ClassifyRequest) -> ClassifyResponse:
    return await handle_classify(request)


@router.post(
    "/reply",
    response_model=ReplyResponse,
    status_code=status.HTTP_200_OK,
    summary="Generate an AI reply to a customer message",
    description=(
        "Classifies the message, injects catalogue context, then calls "
        "OpenRouter to draft a reply.  Pass `catalogue_items` to give the "
        "LLM accurate product/price data."
    ),
)
async def reply_endpoint(request: ReplyRequest) -> ReplyResponse:
    return await handle_reply(request)


@router.post(
    "/webhook",
    response_model=WebhookResponse,
    status_code=status.HTTP_200_OK,
    summary="Twilio WhatsApp inbound webhook",
    description=(
        "Receives inbound WhatsApp messages from Twilio "
        "(application/x-www-form-urlencoded format).  "
        "Classifies and generates a reply. "
        "Actual sending is stubbed until Twilio credentials are configured."
    ),
)
async def twilio_webhook(
    db: AsyncSession = Depends(get_db),
    # Twilio sends form data, not JSON — use Form(...) instead of a Pydantic body.
    # The `...` means the field is required; use `= Form(None)` for optional fields.
    From: str = Form(..., description="Sender WhatsApp number, e.g. whatsapp:+2348012345678"),
    Body: str = Form(..., description="The raw message text"),
    # Optional Twilio fields — accepted but not used yet
    ProfileName: str = Form(None),
    WaId: str = Form(None),
    AccountSid: str = Form(None),
    NumMedia: str = Form("0"),
) -> WebhookResponse:
    if not Body.strip():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Empty message body received from Twilio.",
        )
    return await handle_twilio_webhook(db=db, from_number=From, body=Body)
