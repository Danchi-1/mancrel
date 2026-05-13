"""
api/v1/messaging/schemas.py
===========================
Pydantic models (data contracts) for the messaging endpoints.

Every piece of data that enters or leaves the API is validated against
these models automatically by FastAPI — bad payloads are rejected with a
clear 422 error before they ever reach your controller.

Three endpoint shapes are defined here:

  POST /classify   → ClassifyRequest  → ClassifyResponse
  POST /reply      → ReplyRequest     → ReplyResponse
  POST /webhook    → (Twilio Form)    → plain 200 OK (Twilio ignores the body
                                        when you reply via the REST API)
"""

from __future__ import annotations

from typing import Any, Optional
from pydantic import BaseModel, Field


# ---------------------------------------------------------------------------
# /classify
# ---------------------------------------------------------------------------

class ClassifyRequest(BaseModel):
    """Single message to label with an intent."""
    message: str = Field(..., min_length=1, max_length=2000, examples=["Good morning"])


class ClassifyResponse(BaseModel):
    """Intent label returned by the SetFit classifier."""
    message: str
    label: str = Field(
        ...,
        examples=["polite_greeting"],
        description=(
            "One of: polite_greeting | sales_intent | "
            "support_issue | irrelevant_or_inappropriate"
        ),
    )


# ---------------------------------------------------------------------------
# /reply
# ---------------------------------------------------------------------------

class CatalogueItem(BaseModel):
    """
    A single product/service entry from your catalogue table.

    All fields are optional except `name` so that callers can pass
    partial records without validation errors.  The pipeline only
    injects fields that are actually present, so the LLM can never
    hallucinate a value that wasn't supplied.
    """
    name: str
    price: Optional[str] = None
    available: Optional[bool] = None
    description: Optional[str] = None
    sku: Optional[str] = None


class ReplyRequest(BaseModel):
    """
    Full context needed to generate a WhatsApp reply.

    `catalogue_items` and `conversation_history` are optional so you can
    call the endpoint for a plain greeting without fetching DB data first.
    """
    message: str = Field(..., min_length=1, max_length=2000)
    business_id: Optional[str] = Field(
        None,
        description="Future use: fetch catalogue from DB for this business.",
    )
    catalogue_items: Optional[list[CatalogueItem]] = Field(
        None,
        description="Products/services to inject into the LLM prompt.",
    )
    conversation_history: Optional[list[dict[str, Any]]] = Field(
        None,
        description=(
            "Prior turns in OpenAI message format: "
            '[{"role": "user", "content": "..."}, ...]'
            " — pass the last 4-6 turns."
        ),
    )


class ReplyResponse(BaseModel):
    """
    Structured output from the pipeline.

    `confidence` is 1.0 when the model finished naturally (finish_reason=stop)
    and 0.6 when it was cut off (max_tokens hit).  Use this to decide whether
    to send the reply automatically or queue it for human review.
    """
    reply: str
    confidence: float = Field(..., ge=0.0, le=1.0)
    model_used: str
    label: str


# ---------------------------------------------------------------------------
# /webhook  (Twilio WhatsApp inbound)
# ---------------------------------------------------------------------------

class TwilioWebhookFields:
    """
    Twilio does NOT send JSON — it sends application/x-www-form-urlencoded.
    FastAPI reads these via `Form(...)` parameters, not a Pydantic model,
    so this class just documents the fields for reference.

    Key fields on every inbound WhatsApp message:
      From         — "whatsapp:+2348012345678"
      Body         — the raw message text
      ProfileName  — the sender's WhatsApp display name
      WaId         — phone number without country code (e.g. "2348012345678")
      AccountSid   — your Twilio account SID (use to verify the request)
      NumMedia     — number of media attachments (0 for text messages)
    """


class WebhookResponse(BaseModel):
    """
    Internal response shape we log/return from the webhook handler.
    Twilio itself doesn't consume this — the actual reply is sent via
    Twilio's REST API (or TwiML), not this JSON body.
    """
    status: str
    from_number: str
    label: str
    reply_queued: bool
