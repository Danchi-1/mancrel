"""
api/v1/messaging/pipeline.py
=============================
Message processing pipeline for Mancrel.

Two responsibilities:
  1. classify(text) — label an incoming message using the SetFit classifier.
                      CPU-safe, ~50ms per call. Runs fine on Render free tier.

  2. generate_reply(...) — draft an AI reply via OpenRouter (or any
                           OpenAI-compatible provider). No local GPU needed.

Catalogue injection
-------------------
When a WhatsApp Business message arrives via Twilio, the webhook payload
may include or reference catalogue items. Fetch those items from your DB
before calling generate_reply() and pass them as `catalogue_items`.
The function formats them into a structured block the LLM can reason over.

Example flow:
    raw_text = twilio_payload["Body"]
    label    = classify(raw_text)
    items    = fetch_catalogue_for_business(business_id)   # your DB call
    result   = generate_reply(raw_text, label, catalogue_items=items)

Environment variables
---------------------
OPENROUTER_API_KEY  — your OpenRouter API key (required)
OPENROUTER_MODEL    — model name in OpenRouter format
                      default: meta-llama/llama-3.1-8b-instruct:free
                      other free options:
                        google/gemma-3-27b-it:free
                        mistralai/mistral-7b-instruct:free
                        qwen/qwen3-8b:free
"""

import os
import logging
from typing import Optional

logger = logging.getLogger(__name__)

# ---------------------------------------------------------------------------
# Classifier — SetFit (CPU, loaded lazily on first call)
# ---------------------------------------------------------------------------

_classifier = None


def _get_classifier():
    global _classifier
    if _classifier is None:
        from ml.training.train import load_classifier
        _classifier = load_classifier()
    return _classifier


def classify(text: str) -> str:
    """
    Return the intent label for an incoming message.

    Labels
    ------
    polite_greeting           — "Good morning", "Hello", etc.
    sales_intent              — "How much?", "I want to buy this"
    support_issue             — "My payment failed", "App not working"
    irrelevant_or_inappropriate — off-topic or inappropriate messages

    Raises FileNotFoundError if the classifier hasn't been trained yet.
    Run:  python -m ml.training.train --train
    """
    model = _get_classifier()
    return model.predict([text])[0]


# ---------------------------------------------------------------------------
# Catalogue formatter
# ---------------------------------------------------------------------------

def _format_catalogue(items: list[dict]) -> str:
    """
    Convert a list of catalogue dicts into a numbered plain-text block
    the LLM can reason over without hallucinating.

    Expected item shape (all fields optional except 'name'):
        {
            "name":        str,   # product/service name
            "price":       str,   # e.g. "₦4,500" or "N/A"
            "available":   bool,  # in stock?
            "description": str,   # short description
            "sku":         str,   # optional identifier
        }

    If a field is missing it is omitted from the formatted line so the LLM
    cannot invent a value for it.
    """
    if not items:
        return "(No catalogue items provided)"

    lines = []
    for i, item in enumerate(items, start=1):
        parts = [f"{i}. {item.get('name', 'Unknown item')}"]

        if "price" in item:
            parts.append(f"Price: {item['price']}")
        if "available" in item:
            status = "In stock" if item["available"] else "Out of stock"
            parts.append(status)
        if "description" in item:
            parts.append(item["description"])
        if "sku" in item:
            parts.append(f"SKU: {item['sku']}")

        lines.append(" | ".join(parts))

    return "\n".join(lines)


# ---------------------------------------------------------------------------
# System prompt
# ---------------------------------------------------------------------------

SYSTEM_PROMPT = """\
You are a professional AI sales and support assistant for a business.
You respond to incoming customer messages on behalf of that business.

CATALOGUE RULES (CRITICAL — read before every response)
---------------------------------------------------------
You will be given a CATALOGUE BLOCK below. It lists every product or service
this business currently offers, with prices and availability.

Rules you must follow WITHOUT EXCEPTION:
1. If a customer asks about a product's price, availability, or details —
   only use what is listed in the CATALOGUE BLOCK. Never invent or estimate.
2. If the product they asked about is NOT in the catalogue, say so clearly:
   "I don't currently have information on that item. Let me find out for you."
3. If a product is listed as "Out of stock", tell the customer honestly and
   offer to notify them when it returns, or suggest an alternative if one
   exists in the catalogue.
4. Do not quote a price that isn't explicitly in the catalogue.
5. If NO catalogue is provided (it will say "No catalogue items provided"),
   do not guess at prices or availability — acknowledge and offer to help.

TONE RULES (based on message classification)
---------------------------------------------
polite_greeting           → Warm, brief, professional. Acknowledge and invite
                            them to ask what they need.
sales_intent              → Enthusiastic but not pushy. Use catalogue data
                            directly. Guide them toward a purchase naturally.
support_issue             → Calm, empathetic, solution-first. Acknowledge the
                            problem, give concrete next steps. Escalate if
                            the issue needs a human.
irrelevant_or_inappropriate → Politely redirect to business topics. Do not
                              engage with off-topic or inappropriate content.

RESPONSE FORMAT
---------------
- Keep replies under 120 words unless the customer's complexity demands more.
- Write in plain conversational text. No markdown, no bullet points.
- End sales replies with a clear call to action.
- Sign off as "the team" not as a named individual.
"""


# ---------------------------------------------------------------------------
# Reply generation
# ---------------------------------------------------------------------------

OPENROUTER_BASE_URL = "https://openrouter.ai/api/v1"
DEFAULT_MODEL = "google/gemma-4-31b-it:free"

# Free model availability rotates — what's listed here may go offline.
# Always check the live list before switching:
#   https://openrouter.ai/models?order=newest&supported_parameters=free
#
# Currently live (as of May 2026):
#   google/gemma-4-31b-it:free          ← default, instruction-tuned
#   qwen/qwen3-next-80b-a3b-instruct:free
#   openai/gpt-oss-20b:free
#   openai/gpt-oss-120b:free
#   nvidia/nemotron-3-super-120b-a12b:free


def generate_reply(
    message: str,
    classification: str,
    catalogue_items: Optional[list[dict]] = None,
    conversation_history: Optional[list[dict]] = None,
) -> dict:
    """
    Generate a reply draft for an incoming customer message.

    Parameters
    ----------
    message : str
        The raw customer message text (from Twilio WhatsApp webhook Body).

    classification : str
        Output of classify(). Tells the LLM which tone rules to apply.

    catalogue_items : list[dict] | None
        Products/services for this business fetched from the database before
        calling this function. Each dict should follow the shape described in
        _format_catalogue(). Pass None or [] if the message doesn't need
        catalogue context (e.g. a plain greeting).

        Example:
            [
                {"name": "Prepaid Meter Token", "price": "₦500",
                 "available": True, "description": "1000 unit top-up"},
                {"name": "Enterprise Plan", "price": "₦45,000/month",
                 "available": True, "description": "Unlimited API calls"},
            ]

    conversation_history : list[dict] | None
        Previous turns in this conversation, in OpenAI message format:
            [{"role": "user", "content": "..."}, {"role": "assistant", "content": "..."}]
        Pass the last 4–6 turns to keep context manageable.

    Returns
    -------
    dict:
        reply       : str   — the generated reply text (ready to send)
        confidence  : float — 1.0 if the model finished cleanly, 0.6 if cut off
        model_used  : str   — which model produced the reply
        label       : str   — echoes back the classification label
    """
    from openai import OpenAI

    api_key = os.environ.get("OPENROUTER_API_KEY")
    if not api_key:
        raise EnvironmentError(
            "OPENROUTER_API_KEY is not set. "
            "Get a free key at https://openrouter.ai and set the environment variable."
        )

    model_name = os.environ.get("OPENROUTER_MODEL", DEFAULT_MODEL)

    client = OpenAI(
        api_key=api_key,
        base_url=OPENROUTER_BASE_URL,
        default_headers={
            # OpenRouter recommends sending these for routing + analytics
            "HTTP-Referer": os.environ.get("APP_URL", "https://mancrel.app"),
            "X-Title": "Mancrel CRM",
        },
    )

    # Build the catalogue block — always present so the LLM knows whether
    # it has product data or not
    catalogue_block = _format_catalogue(catalogue_items or [])

    # The user-facing message includes the catalogue so the LLM sees it
    # in the same turn as the customer question — better than system prompt
    # injection because it keeps the catalogue close to the question
    user_content = (
        f"[CATALOGUE BLOCK]\n"
        f"{catalogue_block}\n\n"
        f"[MESSAGE CLASSIFICATION]\n"
        f"{classification}\n\n"
        f"[CUSTOMER MESSAGE]\n"
        f"{message}"
    )

    messages = [{"role": "system", "content": SYSTEM_PROMPT}]

    # Inject prior conversation turns for context (if provided)
    if conversation_history:
        messages.extend(conversation_history)

    messages.append({"role": "user", "content": user_content})

    logger.info(
        "[pipeline] generate_reply | label=%s | model=%s | catalogue_items=%d",
        classification,
        model_name,
        len(catalogue_items) if catalogue_items else 0,
    )

    try:
        response = client.chat.completions.create(
            model=model_name,
            messages=messages,
            max_tokens=250,
            temperature=0.3,   # lower = more factual, less creative — important for prices
        )
    except Exception as e:
        error_str = str(e)
        if "404" in error_str and "No endpoints found" in error_str:
            raise RuntimeError(
                f"Model '{model_name}' is not available on OpenRouter right now.\n"
                "Free models occasionally go offline. Pick a different one at:\n"
                "  https://openrouter.ai/models?order=newest&supported_parameters=free\n"
                f"Then set OPENROUTER_MODEL=<new-model-name> in your .env."
            ) from e
        raise

    choice = response.choices[0]
    reply_text = choice.message.content.strip()
    confidence = 1.0 if choice.finish_reason == "stop" else 0.6

    return {
        "reply": reply_text,
        "confidence": confidence,
        "model_used": model_name,
        "label": classification,
    }