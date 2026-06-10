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

from fastapi import APIRouter, Form, Request, Query, HTTPException, status, Depends, BackgroundTasks
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select

from db.session import get_db
from db.models import Message, User
from api.v1.auth.deps import get_current_user

from .controllers import (
    handle_classify,
    handle_reply,
    process_meta_webhook_bg,
    process_twilio_webhook_bg,
)
from .schemas import ClassifyRequest, ClassifyResponse, ReplyRequest, ReplyResponse, WebhookResponse

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/messaging", tags=["Messaging"])


# ---------------------------------------------------------------------------
# Twilio WhatsApp webhook (POST) — ACTIVE
# ---------------------------------------------------------------------------

@router.post("/twilio-webhook/{user_id}", response_model=WebhookResponse, summary="Twilio inbound WhatsApp webhook")
async def twilio_webhook(
    user_id: str,
    request: Request,
    bg_tasks: BackgroundTasks,
    db: AsyncSession = Depends(get_db)
) -> WebhookResponse:
    """Receives inbound WhatsApp messages from Twilio sandbox/production."""
    try:
        form_data = await request.form()
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid form data")
        
    From = form_data.get("From", "")
    Body = form_data.get("Body", "")
    ProfileName = form_data.get("ProfileName", "")
    MessageSid = form_data.get("MessageSid", "")
    
    if not From:
        logger.error("[twilio_webhook] Missing 'From' in payload")
        raise HTTPException(status_code=400, detail="Missing From")

    NumMedia = int(form_data.get("NumMedia", 0))
    media_url = form_data.get("MediaUrl0", "") if NumMedia > 0 else ""

    if not Body.strip() and not media_url:
        # Do not throw a 400, otherwise Twilio logs a webhook error.
        # Just ignore empty messages gracefully for now.
        return WebhookResponse(status="ignored", from_number=From.replace("whatsapp:", ""), label="empty_body", reply_queued=False)

    # Strip Twilio's "whatsapp:" prefix to get a clean phone number
    sender_phone = From.replace("whatsapp:", "").strip()
    sender_name = ProfileName or sender_phone

    # Fetch the user
    result = await db.execute(select(User).where(User.id == user_id))
    user = result.scalar_one_or_none()
    if not user:
        logger.warning(f"[twilio_webhook] Unknown user_id {user_id}")
        return WebhookResponse(status="unknown_user", from_number=sender_phone, label="", reply_queued=False)

    bg_tasks.add_task(
        process_twilio_webhook_bg,
        user_id=user.id,
        sender_phone=sender_phone,
        sender_name=sender_name,
        message_text=Body,
        message_sid=MessageSid,
        media_url=media_url,
    )

    return WebhookResponse(status="ok", from_number=sender_phone, label="", reply_queued=True)


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
async def meta_webhook(
    request: Request,
    bg_tasks: BackgroundTasks,
    db: AsyncSession = Depends(get_db)
):
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

    bg_tasks.add_task(
        process_meta_webhook_bg,
        user_id=user.id,
        sender_phone=sender_phone,
        sender_name=sender_name,
        message_text=message_text,
        wa_message_id=wa_message_id,
    )

    return WebhookResponse(status="ok", from_number=sender_phone, label="", reply_queued=True)


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
            "full_text": msg.full_text,
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
# Semantic Search (Vector DB)
# ---------------------------------------------------------------------------

@router.get("/search/semantic", summary="Semantic AI Search")
async def semantic_search(
    query: str,
    target: str = Query("inbox", description="Either 'inbox' or 'catalogue'"),
    current_user: User = Depends(get_current_user)
):
    """
    Takes a search query, generates embeddings, and performs a cosine-similarity
    search against the ChromaDB vector database.
    """
    try:
        from .vector_db import inbox_collection, catalogue_collection
    except ImportError:
        raise HTTPException(status_code=500, detail="Vector DB not initialized")

    collection = inbox_collection if target == "inbox" else catalogue_collection
    if not collection:
        raise HTTPException(status_code=500, detail="Target collection not initialized")

    try:
        # ChromaDB automatically embeds the query using our custom embedding function
        # and compares it against all stored vectors, returning the closest matches.
        results = collection.query(
            query_texts=[query],
            n_results=10,
            where={"user_id": current_user.id}
        )
        
        # The IDs of the matches are returned in a nested list
        match_ids = results["ids"][0] if results["ids"] else []
        distances = results["distances"][0] if results.get("distances") else []
        
        # We also return distances so the frontend can show the 'similarity score'
        matches = [{"id": match_ids[i], "distance": distances[i]} for i in range(len(match_ids))]
        
        return {"matches": matches}
        
    except Exception as e:
        logger.error("[semantic_search] Failed to query Vector DB: %s", e)
        raise HTTPException(status_code=500, detail=str(e))


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


# ---------------------------------------------------------------------------
# Outbound Messaging endpoints
# ---------------------------------------------------------------------------
from pydantic import BaseModel

class SendManualRequest(BaseModel):
    to_phone: str
    message: str

@router.post("/send-manual")
async def send_manual_message(
    request: SendManualRequest,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Manually send a WhatsApp message to a customer, overriding the AI."""
    from twilio.rest import Client
    from datetime import datetime
    
    if not current_user.twilio_account_sid or not current_user.twilio_auth_token:
        raise HTTPException(status_code=400, detail="Twilio credentials not configured")
        
    try:
        client = Client(current_user.twilio_account_sid, current_user.twilio_auth_token)
        to_num = request.to_phone
        if not to_num.startswith("whatsapp:"):
            if not to_num.startswith("+"): to_num = "+" + to_num
            to_num = f"whatsapp:{to_num}"
            
        from_num = current_user.twilio_phone_number
        if not from_num.startswith("whatsapp:"):
            from_num = f"whatsapp:{from_num}"
            
        twilio_msg = client.messages.create(
            from_=from_num,
            body=request.message,
            to=to_num
        )
        
        # Save to DB
        now_str = datetime.utcnow().strftime("%I:%M %p")
        outbound_msg = Message(
            user_id=current_user.id,
            sender_phone=request.to_phone,
            direction="outbound",
            from_name=current_user.first_name,
            full_text=request.message,
            preview=request.message[:80],
            time=now_str,
            unread=False,
            sentiment="neutral",
        )
        db.add(outbound_msg)
        await db.commit()
        return {"status": "success", "message_sid": twilio_msg.sid}
    except Exception as e:
        logger.error(f"Failed to send manual message: {e}")
        raise HTTPException(status_code=500, detail=str(e))

class BroadcastRequest(BaseModel):
    phones: list[str]
    template_message: str

@router.post("/broadcast")
async def send_broadcast(
    request: BroadcastRequest,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Send a broadcast template message to multiple customers."""
    from twilio.rest import Client
    if not current_user.twilio_account_sid or not current_user.twilio_auth_token:
        raise HTTPException(status_code=400, detail="Twilio credentials not configured")
        
    client = Client(current_user.twilio_account_sid, current_user.twilio_auth_token)
    from_num = current_user.twilio_phone_number
    if not from_num.startswith("whatsapp:"):
        from_num = f"whatsapp:{from_num}"
        
    success_count = 0
    errors = []
    
    for phone in request.phones:
        try:
            to_num = phone
            if not to_num.startswith("whatsapp:"):
                if not to_num.startswith("+"): to_num = "+" + to_num
                to_num = f"whatsapp:{to_num}"
                
            client.messages.create(
                from_=from_num,
                body=request.template_message,
                to=to_num
            )
            success_count += 1
        except Exception as e:
            errors.append({"phone": phone, "error": str(e)})
            
    return {
        "status": "completed",
        "success_count": success_count,
        "failed_count": len(errors),
        "errors": errors
    }
