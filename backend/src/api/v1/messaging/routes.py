"""
api/v1/messaging/routes.py
==========================
FastAPI router for /api/v1/messaging endpoints.

Endpoints:
  POST /twilio/webhook    — Inbound WhatsApp messages from Twilio (ACTIVE)
  GET  /webhook           — Meta webhook verification (ready for future switch)
  POST /webhook           — Meta inbound messages (ready for future switch)
  GET  /inbox             — Fetch message inbox for dashboard
  GET  /conversations/{phone} — Full conversation thread with a sender
  POST /classify          — Manual intent classification
  POST /reply             — Manual AI reply generation
"""

from __future__ import annotations

import logging
from typing import Optional

from fastapi import APIRouter, Form, Request, Query, HTTPException, status, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select

from db.session import get_db
from db.models import Message, User
from api.v1.auth.deps import get_current_user

from .controllers import handle_classify, handle_reply, handle_meta_webhook, handle_twilio_webhook
from .schemas import ClassifyRequest, ClassifyResponse, ReplyRequest, ReplyResponse, WebhookResponse

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/messaging", tags=["Messaging"])


# ---------------------------------------------------------------------------
# Twilio WhatsApp webhook (POST) — ACTIVE
# ---------------------------------------------------------------------------

@router.post("/twilio/webhook", response_model=WebhookResponse, summary="Twilio inbound WhatsApp webhook")
async def twilio_webhook(
    db: AsyncSession = Depends(get_db),
    # Twilio sends form data (application/x-www-form-urlencoded)
    From: str = Form(..., description="Sender WhatsApp number e.g. whatsapp:+2348012345678"),
    Body: str = Form(..., description="Raw message text"),
    ProfileName: str = Form(None),
    MessageSid: str = Form(None),  # Twilio's unique message ID (used for dedup)
    WaId: str = Form(None),        # Sender phone without prefix/country formatting
    AccountSid: str = Form(None),
    NumMedia: str = Form("0"),
) -> WebhookResponse:
    """Receives inbound WhatsApp messages from Twilio sandbox/production."""
    if not Body.strip():
        raise HTTPException(status_code=400, detail="Empty message body.")

    # Strip Twilio's "whatsapp:" prefix to get a clean phone number
    sender_phone = From.replace("whatsapp:", "").strip()
    sender_name = ProfileName or sender_phone

    return await handle_twilio_webhook(
        db=db,
        sender_phone=sender_phone,
        sender_name=sender_name,
        message_text=Body,
        message_sid=MessageSid,
    )


# ---------------------------------------------------------------------------
# Meta webhook verification (GET) — ready for future switch
# ---------------------------------------------------------------------------

@router.get("/webhook", summary="Meta webhook verification")
async def meta_webhook_verify(
    db: AsyncSession = Depends(get_db),
    hub_mode: Optional[str] = Query(None, alias="hub.mode"),
    hub_verify_token: Optional[str] = Query(None, alias="hub.verify_token"),
    hub_challenge: Optional[str] = Query(None, alias="hub.challenge"),
):
    if hub_mode == "subscribe" and hub_verify_token and hub_challenge:
        result = await db.execute(
            select(User).where(User.wa_webhook_verify_token == hub_verify_token)
        )
        user = result.scalar_one_or_none()
        if user:
            logger.info("[webhook_verify] Verified for user %s", user.id)
            from fastapi.responses import PlainTextResponse
            return PlainTextResponse(hub_challenge)
    raise HTTPException(status_code=403, detail="Verification token mismatch")


# ---------------------------------------------------------------------------
# Meta inbound message webhook (POST)
# ---------------------------------------------------------------------------

@router.post("/webhook", response_model=WebhookResponse, summary="Meta inbound WhatsApp webhook")
async def meta_webhook(request: Request, db: AsyncSession = Depends(get_db)):
    """
    Receives inbound WhatsApp messages from Meta Cloud API.
    Extracts the message, runs AI pipeline, sends reply, saves to DB.
    """
    try:
        body = await request.json()
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid JSON body")

    # Navigate Meta's nested webhook payload
    try:
        entry = body["entry"][0]
        change = entry["changes"][0]
        value = change["value"]

        # Extract sender info
        message_obj = value["messages"][0]
        sender_phone = message_obj["from"]
        wa_message_id = message_obj["id"]
        message_text = message_obj.get("text", {}).get("body", "")

        # Sender name from contacts array (may not always be present)
        contacts = value.get("contacts", [{}])
        sender_name = contacts[0].get("profile", {}).get("name", sender_phone)

        # Phone number ID this message arrived on (links to a user)
        phone_number_id = value.get("metadata", {}).get("phone_number_id", "")

    except (KeyError, IndexError):
        # Not a message event (could be status update, read receipt, etc.) — ignore
        logger.debug("[webhook] Non-message event received, ignoring.")
        from fastapi.responses import JSONResponse
        return JSONResponse({"status": "ignored"})

    if not message_text.strip():
        return WebhookResponse(status="empty", from_number=sender_phone, label="", reply_queued=False)

    # Find the user this phone number belongs to
    result = await db.execute(
        select(User).where(User.wa_phone_number_id == phone_number_id)
    )
    user = result.scalar_one_or_none()

    if not user:
        logger.warning("[webhook] No user found for phone_number_id %s", phone_number_id)
        return WebhookResponse(status="no_user", from_number=sender_phone, label="", reply_queued=False)

    return await handle_meta_webhook(
        db=db,
        sender_phone=sender_phone,
        sender_name=sender_name,
        message_text=message_text,
        wa_message_id=wa_message_id,
        user=user,
    )


# ---------------------------------------------------------------------------
# Inbox — all messages for the dashboard
# ---------------------------------------------------------------------------

@router.get("/inbox", summary="Get message inbox")
async def get_inbox(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Returns inbound messages grouped for the AI Inbox dashboard view."""
    stmt = (
        select(Message)
        .where(Message.direction == "inbound")
        .order_by(Message.created_at.desc())
        .limit(50)
    )
    result = await db.execute(stmt)
    messages = result.scalars().all()

    formatted = []
    for msg in messages:
        formatted.append({
            "id": msg.id,
            "from": msg.from_name or msg.sender_phone or "Unknown",
            "company": msg.company or "WhatsApp Customer",
            "subject": msg.subject or "Message",
            "preview": msg.preview or msg.full_text[:80],
            "time": msg.time or msg.created_at.strftime("%I:%M %p"),
            "unread": msg.unread,
            "sentiment": msg.sentiment,
            "sender_phone": msg.sender_phone,
            "aiSuggestion": {
                "confidence": msg.ai_suggestion_confidence or 0,
                "text": msg.ai_suggestion_text or "No suggestion"
            }
        })
    return formatted


# ---------------------------------------------------------------------------
# Conversation thread — full history with one sender
# ---------------------------------------------------------------------------

@router.get("/conversations/{sender_phone}", summary="Get conversation thread")
async def get_conversation(
    sender_phone: str,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Returns all messages (inbound + outbound) for a specific sender phone number."""
    stmt = (
        select(Message)
        .where(Message.sender_phone == sender_phone)
        .order_by(Message.created_at.asc())
    )
    result = await db.execute(stmt)
    messages = result.scalars().all()

    return [
        {
            "id": msg.id,
            "direction": msg.direction,
            "text": msg.full_text,
            "from": msg.from_name,
            "time": msg.time or msg.created_at.strftime("%I:%M %p"),
            "sentiment": msg.sentiment,
        }
        for msg in messages
    ]


# ---------------------------------------------------------------------------
# Manual classify / reply endpoints
# ---------------------------------------------------------------------------

@router.post("/classify", response_model=ClassifyResponse)
async def classify_endpoint(request: ClassifyRequest) -> ClassifyResponse:
    return await handle_classify(request)


@router.post("/reply", response_model=ReplyResponse)
async def reply_endpoint(request: ReplyRequest) -> ReplyResponse:
    return await handle_reply(request)
