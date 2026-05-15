"""
api/v1/messaging/controllers.py
================================
Business-logic handlers for the messaging endpoints.

Controllers sit between routes (HTTP) and the pipeline (AI).
They are responsible for:
  - Calling the pipeline functions
  - Translating pipeline output into response schemas
  - Converting domain errors into meaningful HTTP exceptions

Why keep controllers separate from routes?
  Routes handle HTTP concerns (request parsing, status codes, middleware).
  Controllers handle business concerns (what to do with the data).
  This means you can unit-test controllers without spinning up an HTTP server.

Error mapping
-------------
  FileNotFoundError  → 503  Classifier not ready (model not trained yet)
  EnvironmentError   → 503  Missing API key — configuration problem, not a client error
  RuntimeError       → 503  OpenRouter model offline or quota exceeded
  Exception          → 500  Unexpected — logged and re-raised as a generic server error
"""

from __future__ import annotations

import logging
from typing import Any
import os

from fastapi import HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from db.models import Message

from .pipeline import classify, generate_reply
from .schemas import (
    ClassifyRequest,
    ClassifyResponse,
    ReplyRequest,
    ReplyResponse,
    WebhookResponse,
)

logger = logging.getLogger(__name__)


# ---------------------------------------------------------------------------
# /classify
# ---------------------------------------------------------------------------

async def handle_classify(request: ClassifyRequest) -> ClassifyResponse:
    """
    Run the SetFit classifier on a single message and return its intent label.

    This is a synchronous CPU-bound call wrapped in an async function.
    FastAPI runs it on the default thread pool executor so it won't block
    the event loop — acceptable at low concurrency on a single-worker server.
    If you scale to many simultaneous requests, move to run_in_executor()
    or a dedicated worker.
    """
    try:
        label = classify(request.message)
        return ClassifyResponse(message=request.message, label=str(label))

    except FileNotFoundError as exc:
        # The SetFit model hasn't been trained + saved yet.
        # This is a server-side configuration issue, not a bad request.
        logger.error("[classify] Classifier not found: %s", exc)
        raise HTTPException(
            status_code=503,
            detail=(
                "The intent classifier is not ready. "
                "Run: python -m ml.training.train --train"
            ),
        ) from exc

    except ImportError as exc:
        # setfit / sentence-transformers not installed in this environment.
        logger.error("[classify] ML libraries not installed: %s", exc)
        raise HTTPException(
            status_code=503,
            detail=(
                "ML dependencies are not installed. "
                "Run: pip install -r requirements.txt"
            ),
        ) from exc

    except Exception as exc:
        logger.exception("[classify] Unexpected error")
        raise HTTPException(status_code=500, detail=str(exc)) from exc


# ---------------------------------------------------------------------------
# /reply
# ---------------------------------------------------------------------------

async def handle_reply(request: ReplyRequest) -> ReplyResponse:
    """
    Classify an incoming message then generate an AI reply via OpenRouter.

    Two pipeline calls happen in sequence:
      1. classify(message)      — local SetFit model, ~50ms, CPU only
      2. generate_reply(...)    — network call to OpenRouter, ~1–3s

    The catalogue_items are forwarded as plain dicts because pipeline.py
    works with raw dicts (it predates the Pydantic model).  We convert here
    with .model_dump() so the pipeline never needs to know about Pydantic.

    Note on business_id: the field is accepted but not yet used.
    In the next milestone it will trigger a DB lookup:
        items = await fetch_catalogue(business_id)
    For now, the caller supplies items directly in the request body.
    """
    try:
        # Step 1 — classify (may raise FileNotFoundError / ImportError)
        label = _safe_classify(request.message)

        # Step 2 — convert Pydantic CatalogueItem objects → plain dicts
        catalogue_dicts: list[dict[str, Any]] | None = None
        if request.catalogue_items:
            catalogue_dicts = [
                item.model_dump(exclude_none=True)
                for item in request.catalogue_items
            ]

        # Step 3 — generate reply (network call to OpenRouter)
        result = generate_reply(
            message=request.message,
            classification=label,
            catalogue_items=catalogue_dicts,
            conversation_history=request.conversation_history,
        )

        return ReplyResponse(**result)

    except HTTPException:
        raise  # already formatted by _safe_classify

    except EnvironmentError as exc:
        # OPENROUTER_API_KEY not set — server misconfiguration
        logger.error("[reply] Missing env var: %s", exc)
        raise HTTPException(
            status_code=503,
            detail="OpenRouter API key is not configured on the server.",
        ) from exc

    except RuntimeError as exc:
        # Model offline or quota exceeded on OpenRouter
        logger.error("[reply] OpenRouter runtime error: %s", exc)
        raise HTTPException(status_code=503, detail=str(exc)) from exc

    except Exception as exc:
        logger.exception("[reply] Unexpected error")
        raise HTTPException(status_code=500, detail=str(exc)) from exc


# webhook  (Twilio inbound WhatsApp)
async def handle_twilio_webhook(
    db: AsyncSession,
    from_number: str,
    body: str,
) -> WebhookResponse:
    """
    Process an inbound Twilio WhatsApp message.
    """
    logger.info("[webhook] Inbound from %s: %s", from_number, body[:80])

    try:
        label = _safe_classify(body)
        result = generate_reply(message=body, classification=label)
        
        reply_text = result["reply"]
        confidence = result.get("confidence", 1.0)
        
        # Save inbound message to DB
        new_msg = Message(
            from_name=from_number,
            company="Unknown (WhatsApp)",
            subject="WhatsApp Inquiry",
            full_text=body,
            preview=body[:50],
            unread=True,
            sentiment="neutral", # or extract from label
            ai_suggestion_confidence=confidence * 100,
            ai_suggestion_text=reply_text
        )
        db.add(new_msg)
        await db.commit()
        await db.refresh(new_msg)

        logger.info(
            "[webhook] Reply drafted: %s…", reply_text[:60]
        )
        
        reply_queued = False
        
        # Real Twilio Send
        from twilio.rest import Client
        
        account_sid = os.environ.get("TWILIO_ACCOUNT_SID")
        auth_token = os.environ.get("TWILIO_AUTH_TOKEN")
        twilio_number = os.environ.get("TWILIO_PHONE_NUMBER")
        
        if account_sid and auth_token and twilio_number:
            client = Client(account_sid, auth_token)
            
            message = client.messages.create(
                from_=twilio_number,
                body=reply_text,
                to=from_number
            )
            logger.info(f"Sent WhatsApp message: {message.sid}")
            reply_queued = True
        else:
            logger.warning("Twilio credentials not fully set up. Message not sent.")

        return WebhookResponse(
            status="ok",
            from_number=from_number,
            label=label,
            reply_queued=reply_queued,
        )

    except HTTPException:
        raise
    except Exception as exc:
        logger.exception("[webhook] Unhandled error")
        raise HTTPException(status_code=500, detail=str(exc)) from exc


# ---------------------------------------------------------------------------
# Private helpers
# ---------------------------------------------------------------------------

def _safe_classify(message: str) -> str:
    """
    Wrap classify() so that both handle_reply and handle_webhook get the
    same consistent HTTP error if the model isn't ready — without duplicating
    the try/except block everywhere.
    """
    try:
        return str(classify(message))
    except FileNotFoundError as exc:
        raise HTTPException(
            status_code=503,
            detail=(
                "The intent classifier is not ready. "
                "Run: python -m ml.training.train --train"
            ),
        ) from exc
    except ImportError as exc:
        raise HTTPException(
            status_code=503,
            detail="ML dependencies are not installed. Run: pip install -r requirements.txt",
        ) from exc
