"""
api/v1/messaging/controllers.py
================================
Business-logic handlers for the messaging endpoints.

Handles:
  - Inbound webhook from Meta Cloud API
  - AI classification + reply generation with conversation history
  - Sending replies back via Meta Graph API
  - Persisting messages to DB
"""

from __future__ import annotations

import logging
from typing import Any
import os
from datetime import datetime

import httpx
from fastapi import HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select

from db.models import Message, User
from .pipeline import generate_reply
from .schemas import (
    ClassifyRequest,
    ClassifyResponse,
    ReplyRequest,
    ReplyResponse,
    WebhookResponse,
)

logger = logging.getLogger(__name__)

META_GRAPH_VERSION = "v19.0"
META_API_BASE = f"https://graph.facebook.com/{META_GRAPH_VERSION}"


# ---------------------------------------------------------------------------
# /classify
# ---------------------------------------------------------------------------

async def handle_classify(request: ClassifyRequest) -> ClassifyResponse:
    try:
        label = _safe_classify(request.message)
        return ClassifyResponse(message=request.message, label=str(label))
    except FileNotFoundError as exc:
        logger.error("[classify] Classifier not found: %s", exc)
        raise HTTPException(status_code=503, detail="Classifier not ready.") from exc
    except ImportError as exc:
        logger.error("[classify] ML libraries not installed: %s", exc)
        raise HTTPException(status_code=503, detail="ML dependencies not installed.") from exc
    except Exception as exc:
        logger.exception("[classify] Unexpected error")
        raise HTTPException(status_code=500, detail=str(exc)) from exc


# ---------------------------------------------------------------------------
# /reply
# ---------------------------------------------------------------------------

async def handle_reply(request: ReplyRequest) -> ReplyResponse:
    try:
        label = _safe_classify(request.message)
        catalogue_dicts: list[dict[str, Any]] | None = None
        if request.catalogue_items:
            catalogue_dicts = [item.model_dump(exclude_none=True) for item in request.catalogue_items]

        result = generate_reply(
            message=request.message,
            classification=label,
            catalogue_items=catalogue_dicts,
            conversation_history=request.conversation_history,
        )
        return ReplyResponse(**result)

    except HTTPException:
        raise
    except EnvironmentError as exc:
        raise HTTPException(status_code=503, detail="OpenRouter API key not configured.") from exc
    except RuntimeError as exc:
        raise HTTPException(status_code=503, detail=str(exc)) from exc
    except Exception as exc:
        logger.exception("[reply] Unexpected error")
        raise HTTPException(status_code=500, detail=str(exc)) from exc


# ---------------------------------------------------------------------------
# Meta Cloud API webhook
# ---------------------------------------------------------------------------

async def handle_meta_webhook(
    db: AsyncSession,
    sender_phone: str,
    sender_name: str,
    message_text: str,
    wa_message_id: str,
    user: User,
) -> WebhookResponse:
    """
    Full pipeline for an inbound Meta WhatsApp message:
      1. Deduplicate (Meta re-delivers on failure)
      2. Fetch conversation history for this sender
      3. Classify intent
      4. Generate AI reply with history + catalogue context
      5. Send reply via Meta Graph API
      6. Persist both inbound + outbound messages
    """
    logger.info("[meta_webhook] Inbound from %s (%s): %s", sender_name, sender_phone, message_text[:80])

    # 1. Deduplicate by wa_message_id
    existing = await db.execute(select(Message).where(Message.wa_message_id == wa_message_id))
    if existing.scalar_one_or_none():
        logger.info("[meta_webhook] Duplicate message %s, skipping.", wa_message_id)
        return WebhookResponse(status="duplicate", from_number=sender_phone, label="", reply_queued=False)

    # 2. Fetch last 10 messages with this sender (conversation history)
    history_result = await db.execute(
        select(Message)
        .where(Message.sender_phone == sender_phone)
        .order_by(Message.created_at.desc())
        .limit(10)
    )
    history_msgs = list(reversed(history_result.scalars().all()))
    conversation_history = [
        {"role": "user" if m.direction == "inbound" else "assistant", "content": m.full_text}
        for m in history_msgs
    ]

    # 3. Classify intent (graceful fallback if ML not installed)
    label = _safe_classify(message_text)

    # 4. Generate AI reply
    result = generate_reply(
        message=message_text,
        classification=label,
        catalogue_items=None,  # TODO: fetch from Meta Catalogue API
        conversation_history=conversation_history,
    )
    reply_text = result["reply"]
    confidence = result.get("confidence", 1.0)

    # 5. Save inbound message
    now_str = datetime.utcnow().strftime("%I:%M %p")
    inbound_msg = Message(
        sender_phone=sender_phone,
        direction="inbound",
        wa_message_id=wa_message_id,
        from_name=sender_name,
        company="WhatsApp Customer",
        subject=f"Message from {sender_name}",
        full_text=message_text,
        preview=message_text[:80],
        time=now_str,
        unread=True,
        sentiment=_label_to_sentiment(label),
        ai_suggestion_confidence=confidence * 100,
        ai_suggestion_text=reply_text,
    )
    db.add(inbound_msg)
    await db.flush()  # get ID without committing yet

    # 6. Send reply via Meta Graph API
    reply_queued = False
    if user.wa_phone_number_id and user.wa_access_token:
        try:
            async with httpx.AsyncClient() as client:
                resp = await client.post(
                    f"{META_API_BASE}/{user.wa_phone_number_id}/messages",
                    headers={
                        "Authorization": f"Bearer {user.wa_access_token}",
                        "Content-Type": "application/json",
                    },
                    json={
                        "messaging_product": "whatsapp",
                        "to": sender_phone,
                        "type": "text",
                        "text": {"body": reply_text},
                    },
                    timeout=10.0,
                )
            if resp.status_code == 200:
                reply_queued = True
                meta_reply_id = resp.json().get("messages", [{}])[0].get("id", "")
                logger.info("[meta_webhook] Reply sent: %s", meta_reply_id)

                # Save outbound message
                outbound_msg = Message(
                    sender_phone=sender_phone,
                    direction="outbound",
                    wa_message_id=meta_reply_id or None,
                    from_name="Mancrel AI",
                    full_text=reply_text,
                    preview=reply_text[:80],
                    time=now_str,
                    unread=False,
                    sentiment="neutral",
                )
                db.add(outbound_msg)
            else:
                logger.warning("[meta_webhook] Meta API returned %s: %s", resp.status_code, resp.text)
        except Exception as e:
            logger.error("[meta_webhook] Failed to send reply: %s", e)
    else:
        logger.warning("[meta_webhook] WA credentials not set for user %s", user.id)

    await db.commit()

    return WebhookResponse(
        status="ok",
        from_number=sender_phone,
        label=label,
        reply_queued=reply_queued,
    )


# ---------------------------------------------------------------------------
# Private helpers
# ---------------------------------------------------------------------------

def _safe_classify(message: str) -> str:
    try:
        from .pipeline import classify
        return str(classify(message))
    except (FileNotFoundError, ImportError):
        # ML not installed on cloud — fall back to keyword-based classification
        text = message.lower()
        if any(w in text for w in ["price", "cost", "how much", "buy", "order", "available"]):
            return "sales_intent"
        if any(w in text for w in ["problem", "issue", "broken", "not working", "failed", "error"]):
            return "support_issue"
        if any(w in text for w in ["hi", "hello", "good morning", "good evening", "hey"]):
            return "polite_greeting"
        return "polite_greeting"


def _label_to_sentiment(label: str) -> str:
    mapping = {
        "sales_intent": "positive",
        "polite_greeting": "positive",
        "support_issue": "concern",
        "irrelevant_or_inappropriate": "neutral",
    }
    return mapping.get(label, "neutral")
