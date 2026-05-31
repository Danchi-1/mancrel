import re

with open("backend/src/api/v1/messaging/pipeline.py", "r") as f:
    content = f.read()

# 1. Update signature
content = content.replace(
    "    on_tool_call: Optional[Callable[[], Awaitable[None]]] = None,\n) -> dict:",
    "    on_tool_call: Optional[Callable[[], Awaitable[None]]] = None,\n    media_url: str = \"\",\n    payment_details: Optional[str] = None,\n) -> dict:"
)

# 2. Update prompt injection
prompt_inj = """    # Build dynamic prompt with catalogue context
    prompt = SYSTEM_PROMPT
    prompt += "\n**CURRENT CONTEXT**\n"
    prompt += f"You are speaking to {customer_name}.\n"
    prompt += f"The user intent is classified as: {classification}\n"

    messages = [{"role": "system", "content": prompt}]

    # Inject prior conversation turns for context (if provided)"""

new_prompt_inj = """    # Build dynamic prompt with catalogue context
    prompt = SYSTEM_PROMPT
    prompt += "\\n**CURRENT CONTEXT**\\n"
    prompt += f"You are speaking to {customer_name}.\\n"
    if payment_details:
        prompt += f"BUSINESS PAYMENT DETAILS: {payment_details}\\n"
        prompt += "Rule: If the customer wants to make a payment, provide these payment details.\\n"
    else:
        prompt += "BUSINESS PAYMENT DETAILS: None set.\\n"
        prompt += "Rule: If the customer asks to pay, use the create_escalation tool with issue_type 'Missing Payment Details' and tell the customer we'll get back to them shortly.\\n"
    prompt += f"The user intent is classified as: {classification}\\n"

    messages = [{"role": "system", "content": prompt}]

    # Inject prior conversation turns for context (if provided)"""

content = content.replace(prompt_inj, new_prompt_inj)

# 3. Update messages payload
msg_inj = """    messages.append({"role": "user", "content": user_content})

    if not openrouter_key:"""

new_msg_inj = """    if media_url:
        messages.append({
            "role": "user",
            "content": [
                {"type": "text", "text": f"{user_content}\\n\\n[USER SENT AN IMAGE]"},
                {"type": "image_url", "image_url": {"url": media_url}}
            ]
        })
    else:
        messages.append({"role": "user", "content": user_content})

    if not openrouter_key:"""

content = content.replace(msg_inj, new_msg_inj)

# 4. Inject tool schema
tool_schema = """                    },
                    "required": ["customer_name", "issue_type"]
                }
            }
        ]

    try:"""

new_tool_schema = """                    },
                    "required": ["customer_name", "issue_type"]
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
        model_to_use = "google/gemini-1.5-flash"

    try:"""

content = content.replace(tool_schema, new_tool_schema)

# 5. Fix completions model param
content = content.replace("model=model_name,", "model=model_to_use,")

# 6. Add tool handler
tool_handler = """            messages.append({
                "role": "tool",
                "tool_call_id": tool_call.id,
                "name": tool_call.function.name,
                "content": tool_result
            })"""

new_tool_handler = """            messages.append({
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
            messages.append({"role": "tool", "tool_call_id": tool_call.id, "name": tool_call.function.name, "content": tool_result})"""

content = content.replace(tool_handler, new_tool_handler, 1)

with open("backend/src/api/v1/messaging/pipeline.py", "w") as f:
    f.write(content)
