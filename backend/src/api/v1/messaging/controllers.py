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
from datetime import datetime, timedelta
import base64

import httpx
from fastapi import HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select

from db.models import Message, User, CatalogueItem, Deal
from .pipeline import generate_reply

try:
    from .vector_db import inbox_collection
except ImportError:
    inbox_collection = None
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

TWILIO_ACCOUNT_SID = os.environ.get("TWILIO_ACCOUNT_SID")
TWILIO_AUTH_TOKEN = os.environ.get("TWILIO_AUTH_TOKEN")
TWILIO_PHONE_NUMBER = os.environ.get("TWILIO_PHONE_NUMBER")  # e.g. "whatsapp:+14155238886"


# ---------------------------------------------------------------------------
# /classify
# ---------------------------------------------------------------------------

async def handle_classify(request: ClassifyRequest) -> ClassifyResponse:
    try:
        label = await _safe_classify(request.message)
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
        label = await _safe_classify(request.message)
        catalogue_dicts: list[dict[str, Any]] | None = None
        if request.catalogue_items:
            catalogue_dicts = [item.model_dump(exclude_none=True) for item in request.catalogue_items]

        result = await generate_reply(
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

async def process_meta_webhook_bg(
    user_id: str,
    sender_phone: str,
    sender_name: str,
    message_text: str,
    wa_message_id: str,
):
    """
    Full background pipeline for an inbound Meta WhatsApp message:
      1. Deduplicate
      2. Fetch conversation history
      3. Classify intent
      4. Generate AI reply
      5. Send reply via Meta
      6. Persist messages
    """
    from db.session import AsyncSessionLocal
    async with AsyncSessionLocal() as db:
        user_result = await db.execute(select(User).where(User.id == user_id))
        user = user_result.scalar_one_or_none()
        if not user:
            logger.error("[meta_webhook_bg] User %s not found.", user_id)
            return

        logger.info("[meta_webhook_bg] Inbound from %s (%s): %s", sender_name, sender_phone, message_text[:80])

        # 1. Deduplicate by wa_message_id
        existing = await db.execute(select(Message).where(Message.wa_message_id == wa_message_id))
        if existing.scalar_one_or_none():
            logger.info("[meta_webhook_bg] Duplicate message %s, skipping.", wa_message_id)
            return

        from db.models import Customer
        cust_query = await db.execute(select(Customer).where(Customer.phone == sender_phone, Customer.user_id == user.id))
        customer = cust_query.scalar_one_or_none()
        if not customer:
            customer = Customer(
                user_id=user.id,
                name=sender_name or "Unknown",
                phone=sender_phone
            )
            db.add(customer)
            await db.flush()

        # 2. Fetch last 10 messages with this sender (conversation history)
        history_result = await db.execute(
            select(Message)
            .where(Message.sender_phone == sender_phone, Message.user_id == user.id)
            .order_by(Message.created_at.desc())
            .limit(10)
        )
        history_msgs = list(reversed(history_result.scalars().all()))
        conversation_history = [
            {"role": "user" if m.direction == "inbound" else "assistant", "content": m.full_text}
            for m in history_msgs
        ]

        # 3. Classify intent (graceful fallback if ML not installed)
        label = await _safe_classify(message_text)
    
        # 3b. Fetch catalogue
        cat_res = await db.execute(select(CatalogueItem).where(CatalogueItem.user_id == user.id))
        db_items = cat_res.scalars().all()
        items = [
            {
                "name": i.name,
                "price": i.price,
                "available": i.available,
                "description": i.description,
                "sku": i.sku
            }
            for i in db_items
        ]

        # 3c. Query Knowledge Base (RAG)
        knowledge_context = ""
        try:
            from api.v1.messaging.vector_db import knowledge_collection
            if knowledge_collection:
                results = knowledge_collection.query(
                    query_texts=[message_text],
                    n_results=2,
                    where={"user_id": user.id}
                )
                if results and results["documents"] and len(results["documents"]) > 0:
                    matched_docs = results["documents"][0]
                    if matched_docs:
                        knowledge_context = "\n---\n".join(matched_docs)
                        logger.info(f"[RAG] Retrieved {len(matched_docs)} knowledge items for context.")
        except Exception as e:
            logger.error(f"[RAG] Failed to query knowledge base: {e}")

        # Define the tool call loading callback
        async def on_tool_call():
            if user.wa_phone_number_id and user.wa_access_token:
                try:
                    async with httpx.AsyncClient() as client:
                        await client.post(
                            f"{META_API_BASE}/{user.wa_phone_number_id}/messages",
                            headers={"Authorization": f"Bearer {user.wa_access_token}", "Content-Type": "application/json"},
                            json={"messaging_product": "whatsapp", "to": sender_phone, "type": "text", "text": {"body": "Just a moment while I pull up those details..."}},
                            timeout=5.0,
                        )
                except Exception as e:
                    logger.error("[meta_webhook_bg] Failed to send loading message: %s", e)

        # 4. Generate AI reply
        result = await generate_reply(
            message=message_text,
            classification=label,
            db=db,
            user_id=user.id,
            business_name=user.business_name or "this business",
            customer_name=sender_name or "the customer",
            customer_phone=sender_phone,
            catalogue_items=items,
            conversation_history=conversation_history,
            on_tool_call=on_tool_call,
            media_url=media_url,
            knowledge_context=knowledge_context,
        )
        reply_text = result["reply"]
        confidence = result.get("confidence", 1.0)

        # Create deal if sales intent
        if label == "sales_intent":
            existing_deal = await db.execute(
                select(Deal).where(
                    Deal.user_id == user.id,
                    Deal.contact == sender_name,
                    Deal.status.notin_(["Closed Won", "Closed Lost"])
                )
            )
            if not existing_deal.scalars().first():
                new_deal = Deal(
                    user_id=user.id,
                    company=sender_name or sender_phone,
                    contact=sender_name or sender_phone,
                    value=0.0,
                    probability=20.0,
                    status="prospect"
                )
                db.add(new_deal)
                # We do not need to explicitly flush here; it will commit at the end.

        # 5. Save inbound message
        now_str = (datetime.utcnow() + timedelta(hours=1)).strftime("%I:%M %p")
        inbound_msg = Message(
            user_id=user.id,
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
        
        if inbox_collection:
            try:
                inbox_collection.add(
                    documents=[message_text],
                    metadatas=[{"user_id": user.id, "message_id": inbound_msg.id, "direction": "inbound"}],
                    ids=[inbound_msg.id]
                )
            except Exception as e:
                logger.error("[meta_webhook_bg] Failed to embed inbound message: %s", e)

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
                        user_id=user.id,
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
                    await db.flush()
                    
                    if inbox_collection:
                        try:
                            inbox_collection.add(
                                documents=[reply_text],
                                metadatas=[{"user_id": user.id, "message_id": outbound_msg.id, "direction": "outbound"}],
                                ids=[outbound_msg.id]
                            )
                        except Exception as e:
                            logger.error("[meta_webhook_bg] Failed to embed outbound message: %s", e)
                else:
                    logger.warning("[meta_webhook] Meta API returned %s: %s", resp.status_code, resp.text)
            except Exception as e:
                logger.error("[meta_webhook] Failed to send reply: %s", e)
        else:
            logger.warning("[meta_webhook] WA credentials not set for user %s", user.id)

        await db.commit()


    # ---------------------------------------------------------------------------
    # Private helpers
    # ---------------------------------------------------------------------------

async def _safe_classify(message: str) -> str:
    from .pipeline import classify
    try:
        return str(await classify(message))
    except Exception as e:
        logger.error("[_safe_classify] Fallback triggered due to error: %s", e)
        # Final safety net just in case the pipeline's internal fallback also fails
        text = message.lower()
        if any(w in text for w in ["price", "cost", "how much", "buy", "order", "available"]):
            return "sales_intent"
        if any(w in text for w in ["problem", "issue", "broken", "not working", "failed", "error"]):
            return "support_issue"
        return "polite_greeting"


def _label_to_sentiment(label: str) -> str:
    mapping = {
        "sales_intent": "positive",
        "polite_greeting": "positive",
        "support_issue": "concern",
        "irrelevant_or_inappropriate": "neutral",
    }
    return mapping.get(label, "neutral")


# ---------------------------------------------------------------------------
# Twilio Media Fetcher
# ---------------------------------------------------------------------------
async def _fetch_twilio_media(media_url: str, account_sid: str, auth_token: str) -> str:
    """Downloads media from Twilio and returns a base64 data URI."""
    try:
        async with httpx.AsyncClient() as client:
            auth = (account_sid, auth_token)
            # Twilio media URLs redirect, so we need follow_redirects=True
            response = await client.get(media_url, auth=auth, follow_redirects=True)
            if response.status_code == 200:
                content_type = response.headers.get("Content-Type", "image/jpeg")
                b64_data = base64.b64encode(response.content).decode("utf-8")
                return f"data:{content_type};base64,{b64_data}"
            else:
                logger.error(f"Failed to fetch Twilio media: {response.status_code} - {response.text}")
    except Exception as e:
        logger.error(f"Error fetching Twilio media: {e}")
    return media_url # fallback to the original URL

# ---------------------------------------------------------------------------
# Twilio WhatsApp webhook handler
# ---------------------------------------------------------------------------

async def process_twilio_webhook_bg(
    user_id: str,
    sender_phone: str,
    sender_name: str,
    message_text: str,
    message_sid: str | None,
    media_url: str = "",
):
    """
    Process an inbound Twilio WhatsApp message in the background.
    """
    from db.session import AsyncSessionLocal
    async with AsyncSessionLocal() as db:
        user_result = await db.execute(select(User).where(User.id == user_id))
        user = user_result.scalar_one_or_none()
        if not user:
            logger.error("[twilio_webhook_bg] User %s not found.", user_id)
            return

        logger.info("[twilio_webhook_bg] Inbound from %s (%s): %s", sender_name, sender_phone, message_text[:80])

        # 1. Deduplicate by Twilio MessageSid
        if message_sid:
            existing = await db.execute(select(Message).where(Message.wa_message_id == message_sid))
            if existing.scalar_one_or_none():
                logger.info("[twilio_webhook_bg] Duplicate %s, skipping.", message_sid)
                return

        from db.models import Customer
        cust_query = await db.execute(select(Customer).where(Customer.phone == sender_phone, Customer.user_id == user.id))
        customer = cust_query.scalar_one_or_none()
        if not customer:
            customer = Customer(
                user_id=user.id,
                name=sender_name or "Unknown",
                phone=sender_phone
            )
            db.add(customer)
            await db.flush()

        # Download Twilio media as base64 so OpenRouter/Gemini can read it
        fetch_sid = user.twilio_account_sid or os.environ.get("TWILIO_ACCOUNT_SID")
        fetch_token = user.twilio_auth_token or os.environ.get("TWILIO_AUTH_TOKEN")
        
        if media_url and fetch_sid and fetch_token:
            media_url = await _fetch_twilio_media(media_url, fetch_sid, fetch_token)

        # 2. Fetch conversation history (last 10 messages with this sender)
        history_result = await db.execute(
            select(Message)
            .where(Message.sender_phone == sender_phone, Message.user_id == user.id)
            .order_by(Message.created_at.desc())
            .limit(10)
        )
        history_msgs = list(reversed(history_result.scalars().all()))
        conversation_history = [
            {"role": "user" if m.direction == "inbound" else "assistant", "content": m.full_text}
            for m in history_msgs
        ]

        # 3. Classify + generate AI reply
        if not message_text.strip() and media_url:
            label = "sales_intent"
        else:
            label = await _safe_classify(message_text)
    
        # Fetch catalogue
        cat_res = await db.execute(select(CatalogueItem).where(CatalogueItem.user_id == user.id))
        db_items = cat_res.scalars().all()
        items = [
            {
                "name": i.name,
                "price": i.price,
                "available": i.available,
                "description": i.description,
                "sku": i.sku
            }
            for i in db_items
        ]
        try:
            # Define Twilio loading indicator
            async def on_tool_call():
                twilio_sid = user.twilio_account_sid or os.environ.get("TWILIO_ACCOUNT_SID")
                twilio_token = user.twilio_auth_token or os.environ.get("TWILIO_AUTH_TOKEN")
                twilio_number = user.twilio_phone_number or os.environ.get("TWILIO_PHONE_NUMBER")
                if twilio_sid and twilio_token and twilio_number:
                    try:
                        from twilio.rest import Client as TwilioClient
                        client = TwilioClient(twilio_sid, twilio_token)
                        # Use a thread pool to avoid blocking the async event loop with Twilio's sync client
                        import asyncio
                        await asyncio.to_thread(
                            client.messages.create,
                            from_=f"whatsapp:{twilio_number.replace('whatsapp:', '')}",
                            to=f"whatsapp:{sender_phone.replace('whatsapp:', '')}",
                            body="Just a moment while I pull up those details..."
                        )
                    except Exception as e:
                        logger.error("[twilio_webhook_bg] Failed to send loading message: %s", e)

            result = await generate_reply(
                message=message_text,
                classification=label,
                db=db,
                user_id=user.id,
                business_name=user.business_name or "this business",
                customer_name=sender_name or "the customer",
                catalogue_items=items,
                conversation_history=conversation_history,
                on_tool_call=on_tool_call,
                media_url=media_url,
                payment_details=user.payment_details,
            )
            reply_text = result["reply"]
            confidence = result.get("confidence", 1.0)
        except Exception as e:
            logger.error("[twilio_webhook] AI generation failed: %s", e)
            reply_text = "I'm sorry, I'm having trouble connecting to my AI brain right now. Please try again later!"
            confidence = 0.0

        # Create deal if sales intent
        if label == "sales_intent":
            existing_deal = await db.execute(
                select(Deal).where(
                    Deal.user_id == user.id,
                    Deal.contact_name == sender_name,
                    Deal.status.notin_(["Closed Won", "Closed Lost"])
                )
            )
            if not existing_deal.scalars().first():
                new_deal = Deal(
                    user_id=user.id,
                    company=sender_name or sender_phone,
                    contact_name=sender_name or sender_phone,
                    value=0.0,
                    probability=20.0,
                    status="prospect"
                )
                db.add(new_deal)

        # 4. Save inbound message
        now_str = (datetime.utcnow() + timedelta(hours=1)).strftime("%I:%M %p")
        inbound_msg = Message(
            user_id=user.id,
            sender_phone=sender_phone,
            direction="inbound",
            wa_message_id=message_sid,
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
        await db.flush()

        if inbox_collection:
            try:
                doc_text = message_text if message_text.strip() else "[Image Message]"
                inbox_collection.add(
                    documents=[doc_text],
                    metadatas=[{"user_id": user.id, "message_id": inbound_msg.id, "direction": "inbound"}],
                    ids=[inbound_msg.id]
                )
            except Exception as e:
                logger.error("[twilio_webhook_bg] Failed to embed inbound message: %s", e)

        # 5. Send reply via Twilio
        reply_queued = False
        twilio_sid = user.twilio_account_sid or os.environ.get("TWILIO_ACCOUNT_SID")
        twilio_token = user.twilio_auth_token or os.environ.get("TWILIO_AUTH_TOKEN")
        twilio_number = user.twilio_phone_number or os.environ.get("TWILIO_PHONE_NUMBER")

        if twilio_sid and twilio_token and twilio_number:
            try:
                from twilio.rest import Client as TwilioClient
                client = TwilioClient(twilio_sid, twilio_token)
                import asyncio
                sent = await asyncio.to_thread(
                    client.messages.create,
                    from_=f"whatsapp:{twilio_number.replace('whatsapp:', '')}",
                    to=f"whatsapp:{sender_phone.replace('whatsapp:', '')}",
                    body=reply_text,
                )
                reply_queued = True
                logger.info("[twilio_webhook] Reply sent via Twilio: %s", sent.sid)

                # Save outbound reply
                outbound_msg = Message(
                    user_id=user.id,
                    sender_phone=sender_phone,
                    direction="outbound",
                    wa_message_id=sent.sid,
                    from_name="Mancrel AI",
                    full_text=reply_text,
                    preview=reply_text[:80],
                    time=now_str,
                    unread=False,
                    sentiment="neutral",
                )
                db.add(outbound_msg)
                await db.flush()
                
                if inbox_collection:
                    try:
                        inbox_collection.add(
                            documents=[reply_text],
                            metadatas=[{"user_id": user.id, "message_id": outbound_msg.id, "direction": "outbound"}],
                            ids=[outbound_msg.id]
                        )
                    except Exception as e:
                        logger.error("[twilio_webhook_bg] Failed to embed outbound message: %s", e)
            except Exception as e:
                logger.error("[twilio_webhook] Failed to send Twilio reply: %s", e)
        await db.commit()
