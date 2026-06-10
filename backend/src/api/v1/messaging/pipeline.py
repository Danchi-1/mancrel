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
import re
from typing import Optional, Callable, Awaitable

logger = logging.getLogger(__name__)

OPENROUTER_BASE_URL = "https://openrouter.ai/api/v1"
DEFAULT_CLASSIFY_MODEL = "google/gemini-2.5-flash"

async def classify(text: str) -> str:
    """
    Return the intent label for an incoming message using OpenRouter.

    Labels
    ------
    polite_greeting           — "Good morning", "Hello", etc.
    sales_intent              — "How much?", "I want to buy this"
    support_issue             — "My payment failed", "App not working"
    irrelevant_or_inappropriate — off-topic or inappropriate messages
    """
    from openai import AsyncOpenAI

    api_key = os.environ.get("OPENROUTER_API_KEY")
    if not api_key:
        logger.warning("[classify] OPENROUTER_API_KEY missing, falling back to keywords")
        return _keyword_fallback(text)

    model_name = os.environ.get("OPENROUTER_CLASSIFY_MODEL", DEFAULT_CLASSIFY_MODEL)
    client = AsyncOpenAI(
        api_key=api_key,
        base_url=OPENROUTER_BASE_URL,
        default_headers={
            "HTTP-Referer": os.environ.get("APP_URL", "https://mancrel.app"),
            "X-Title": "Mancrel CRM",
        },
    )

    prompt = f"""Classify the following customer message into EXACTLY ONE of these four labels:
1. polite_greeting
2. sales_intent
3. support_issue
4. irrelevant_or_inappropriate

Rules:
- Output ONLY the exact label string and nothing else.
- No punctuation, no explanation.

Customer message:
"{text}"
"""
    try:
        response = await client.chat.completions.create(
            model=model_name,
            messages=[{"role": "user", "content": prompt}],
            temperature=0.0,
            max_tokens=20,
        )
        label = response.choices[0].message.content.strip().lower()
        
        valid_labels = {"polite_greeting", "sales_intent", "support_issue", "irrelevant_or_inappropriate"}
        if label in valid_labels:
            return label
        else:
            logger.warning("[classify] LLM returned invalid label '%s', using fallback", label)
            return _keyword_fallback(text)
    except Exception as e:
        logger.error("[classify] OpenRouter classification failed: %s", e)
        return _keyword_fallback(text)

def _keyword_fallback(text: str) -> str:
    t = text.lower()
    if any(w in t for w in ["price", "cost", "how much", "buy", "order", "available"]):
        return "sales_intent"
    if any(w in t for w in ["problem", "issue", "broken", "not working", "failed", "error"]):
        return "support_issue"
    return "polite_greeting"


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

PAYMENT RULES (CRITICAL)
---------------------------------------------------------
1. If the customer wants to make a payment, you MUST provide the exact BUSINESS PAYMENT DETAILS found in the context below.
2. NEVER use generic templates or placeholders like "[Your bank name]", "[Account Name]", or "[Business Name]". ONLY output the exact numbers and names provided in the context.
3. If the context says "BUSINESS PAYMENT DETAILS: None set.", you MUST NOT ask them to pay. Instead, use the create_escalation tool with issue_type 'Missing Payment Details' and tell the customer you will look it up and a human will get back to them shortly.

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

IMAGE RULES (CRITICAL)
---------------------------------------------------------
- If the user sends an image, you MUST look at the image and describe or identify what is in it to answer their query.
- NEVER claim that you cannot see or identify images. You have vision capabilities.
- If they ask if an item in the image is in the catalogue, compare the image contents to the CATALOGUE BLOCK.

RESPONSE FORMAT
---------------
- Keep replies under 120 words unless the customer's complexity demands more.
- Write in plain conversational text. No markdown, no bullet points.
- End sales replies with a clear call to action.
- Do not use any generic sign-offs like "The team" or "Mancrel AI". Just end the message naturally.
- IMPORTANT: DO NOT output any internal thoughts, reasoning steps, or <think> tags. Only output the final response that the customer will see.
"""


# ---------------------------------------------------------------------------
# Reply generation
# ---------------------------------------------------------------------------


DEFAULT_MODEL = "nvidia/nemotron-3-super-120b-a12b:free"

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


from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from db.models import Customer, Deal, Escalation, User
import json

async def generate_reply(
    message: str,
    classification: str,
    db: AsyncSession = None,
    user_id: str = None,
    business_name: str = "this business",
    customer_name: str = "the customer",
    catalogue_items: Optional[list[dict]] = None,
    conversation_history: Optional[list[dict]] = None,
    on_tool_call: Optional[Callable[[], Awaitable[None]]] = None,
    media_url: str = "",
    payment_details: Optional[str] = None,
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
    from openai import AsyncOpenAI

    api_key = os.environ.get("OPENROUTER_API_KEY")
    if not api_key:
        raise EnvironmentError(
            "OPENROUTER_API_KEY is not set. "
            "Get a free key at https://openrouter.ai and set the environment variable."
        )

    model_name = os.environ.get("OPENROUTER_MODEL", DEFAULT_MODEL)

    client = AsyncOpenAI(
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
    logger.info(f"[pipeline] Injected payment_details: {payment_details}")
    user_content = (
        f"[CATALOGUE BLOCK]\n"
        f"{catalogue_block}\n\n"
        f"[MESSAGE CLASSIFICATION]\n"
        f"{classification}\n\n"
        f"Context:\n"
        f"You are speaking on behalf of: {business_name}\n"
        f"The customer's name is: {customer_name}\n\n"
        f"[CUSTOMER MESSAGE]\n"
        f"{message}"
    )

    dynamic_prompt = SYSTEM_PROMPT
    if payment_details:
        dynamic_prompt += f"\nBUSINESS PAYMENT DETAILS: {payment_details}\n"
        dynamic_prompt += "Rule: If the customer wants to make a payment, provide these payment details.\n"
    else:
        dynamic_prompt += "\nBUSINESS PAYMENT DETAILS: None set.\n"
        dynamic_prompt += "Rule: If the customer asks to pay, use the create_escalation tool with issue_type 'Missing Payment Details' and tell the customer we'll get back to them shortly.\n"

    messages = [{"role": "system", "content": dynamic_prompt}]

    # Inject prior conversation turns for context (if provided)
    if conversation_history:
        messages.extend(conversation_history)

    if media_url:
        messages.append({
            "role": "user",
            "content": [
                {"type": "text", "text": f"{user_content}\n\n[USER SENT AN IMAGE. Please analyze the attached image to answer their query.]"},
                {"type": "image_url", "image_url": {"url": media_url}}
            ]
        })
    else:
        messages.append({"role": "user", "content": user_content})

    logger.info(
        "[pipeline] generate_reply | label=%s | model=%s | catalogue_items=%d",
        classification,
        model_to_use,
        len(catalogue_items) if catalogue_items else 0,
    )

    tools = [
        {
            "type": "function",
            "function": {
                "name": "get_active_deals",
                "description": "Get all active deals and their value for the user",
                "parameters": {
                    "type": "object",
                    "properties": {},
                    "required": []
                }
            }
        },
        {
            "type": "function",
            "function": {
                "name": "create_escalation",
                "description": "Create an escalation ticket to alert a human manager if the customer is angry, requesting a human, or the issue cannot be resolved by AI.",
                "parameters": {
                    "type": "object",
                    "properties": {
                        "customer_name": {
                            "type": "string",
                            "description": "The name of the customer, or 'Unknown' with phone number e.g 'Unknown +2348000000000' if not provided."
                        },
                        "issue_type": {
                            "type": "string",
                            "description": "A short summary of what the customer is angry or asking about."
                        }
                    },
                    "required": ["customer_name", "issue_type"]
                }
            }
        },
        {
            "type": "function",
            "function": {
                "name": "notify_owner_receipt",
                "description": "Trigger this when the customer uploads an image representing a payment receipt. It will notify the business owner to verify the payment.",
                "parameters": {"type": "object", "properties": {}, "required": []}
            }
        }
    ]

    model_to_use = model_name
    if media_url:
        # Use a more reliable vision model for image recognition
        model_to_use = "google/gemini-2.5-flash-image"

    try:
        response = await client.chat.completions.create(
            model=model_to_use,
            messages=messages,
            tools=tools,
            max_tokens=1024,
            temperature=0.3,
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
    
    if choice.message.tool_calls:
        # Simple tool execution mock for active deals
        tool_call = choice.message.tool_calls[0]
        
        # Fire the loading indicator callback if provided
        if on_tool_call:
            try:
                await on_tool_call()
            except Exception as e:
                logger.error("[pipeline] on_tool_call callback failed: %s", e)

        if tool_call.function.name == "get_active_deals" and db and user_id:
            result = await db.execute(select(Deal).where(Deal.user_id == user_id, Deal.status != 'Closed Lost'))
            deals = result.scalars().all()
            tool_result = f"Found {len(deals)} active deals."
            
            messages.append(choice.message)
            messages.append({
                "role": "tool",
                "tool_call_id": tool_call.id,
                "name": tool_call.function.name,
                "content": tool_result
            })
            
        elif tool_call.function.name == "notify_owner_receipt" and db and user_id:
            logger.info("[pipeline] AI invoked notify_owner_receipt.")
            if on_tool_call:
                try: await on_tool_call()
                except Exception as e: logger.error(e)
                
            from api.v1.messaging.email_service import send_receipt_verification_alert
            user_res = await db.execute(select(User).where(User.id == user_id))
            user_obj = user_res.scalar_one_or_none()
            if user_obj:
                import asyncio
                if user_obj.email:
                    asyncio.create_task(send_receipt_verification_alert(user_obj.email, customer_name))
                if user_obj.phone and user_obj.twilio_account_sid and user_obj.twilio_auth_token:
                    try:
                        from twilio.rest import Client
                        tc = Client(user_obj.twilio_account_sid, user_obj.twilio_auth_token)
                        to_num = user_obj.phone if user_obj.phone.startswith("+") else "+" + user_obj.phone
                        from_num = f"whatsapp:{user_obj.twilio_phone_number.replace('whatsapp:', '')}"
                        to_num_wa = f"whatsapp:{to_num.replace('whatsapp:', '')}"
                        asyncio.to_thread(
                            tc.messages.create,
                            from_=from_num,
                            to=to_num_wa,
                            body=f"Action Required: {customer_name} has submitted a payment receipt. Please verify it in your dashboard."
                        )
                    except Exception as e:
                        logger.error(e)
            tool_result = "Owner notified to verify receipt."
            messages.append({"role": "tool", "tool_call_id": tool_call.id, "name": tool_call.function.name, "content": tool_result})
            
            response = await client.chat.completions.create(
                model=model_to_use,
                messages=messages,
                max_tokens=1024,
                temperature=0.3,
            )
            choice = response.choices[0]
            
        elif tool_call.function.name == "create_escalation" and db and user_id:
            try:
                args = json.loads(tool_call.function.arguments)
                customer_name = args.get("customer_name", "Unknown")
                issue_type = args.get("issue_type", "General Support Escalation")
                
                # Save Escalation to DB
                new_esc = Escalation(
                    user_id=user_id,
                    customer_name=customer_name,
                    issue_type=issue_type,
                    channel="whatsapp",
                    status="Open"
                )
                db.add(new_esc)
                # Flush to get ID if needed, but not strictly required
                
                # Fetch user to trigger alert
                user_res = await db.execute(select(User).where(User.id == user_id))
                user_obj = user_res.scalar_one_or_none()
                if user_obj:
                    from api.v1.messaging.escalation_service import trigger_escalation_alert
                    await trigger_escalation_alert(db, new_esc, user_obj)
                
                tool_result = "Escalation created successfully. Human manager has been alerted."
            except Exception as e:
                logger.error(f"[pipeline] Failed to create escalation: {e}")
                tool_result = "Failed to create escalation."
                
            messages.append(choice.message)
            messages.append({
                "role": "tool",
                "tool_call_id": tool_call.id,
                "name": tool_call.function.name,
                "content": tool_result
            })
            
            response = await client.chat.completions.create(
                model=model_to_use,
                messages=messages,
                max_tokens=1024,
                temperature=0.3,
            )
            choice = response.choices[0]

    raw_reply_text = choice.message.content.strip() if choice.message.content else ""
    # Strip <think> blocks (even if unclosed)
    reply_text = re.sub(r'<think>.*?(</think>|$)', '', raw_reply_text, flags=re.DOTALL).strip()
    
    # Fallback if the model only output thoughts or an empty string
    if not reply_text:
        reply_text = "I'm sorry, I'm processing a lot right now. Could you rephrase your question?"
    
    confidence = 1.0 if choice.finish_reason == "stop" else 0.6

    return {
        "reply": reply_text,
        "confidence": confidence,
        "model_used": model_name,
        "label": classification,
    }