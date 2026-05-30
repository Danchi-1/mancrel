import re

file_path = "/home/danchi/Documents/code/mancrel/backend/src/api/v1/messaging/routes.py"
with open(file_path, "r") as f:
    content = f.read()

# Replace the twilio_webhook signature and parsing
old_signature = """@router.post("/twilio-webhook/{user_id}", response_model=WebhookResponse, summary="Twilio inbound WhatsApp webhook")
async def twilio_webhook(
    user_id: str,
    bg_tasks: BackgroundTasks,
    db: AsyncSession = Depends(get_db),
    # Twilio sends form data (application/x-www-form-urlencoded)
    From: str = Form(..., description="Sender WhatsApp number e.g. whatsapp:+2348012345678"),
    Body: str = Form("", description="Raw message text"),
    ProfileName: Optional[str] = Form(None),
    MessageSid: Optional[str] = Form(None),  # Twilio's unique message ID (used for dedup)
    WaId: Optional[str] = Form(None),        # Sender phone without prefix/country formatting
    AccountSid: Optional[str] = Form(None),
    NumMedia: str = Form("0"),
) -> WebhookResponse:
    \"\"\"Receives inbound WhatsApp messages from Twilio sandbox/production.\"\"\"
    if not Body.strip():
        # Do not throw a 400, otherwise Twilio logs a webhook error.
        # Just ignore empty messages (e.g. image-only) gracefully for now.
        return WebhookResponse(status="ignored", from_number=From.replace("whatsapp:", ""), label="empty_body", reply_queued=False)

    # Strip Twilio's "whatsapp:" prefix to get a clean phone number
    sender_phone = From.replace("whatsapp:", "").strip()
    sender_name = ProfileName or sender_phone"""

new_signature = """@router.post("/twilio-webhook/{user_id}", response_model=WebhookResponse, summary="Twilio inbound WhatsApp webhook")
async def twilio_webhook(
    user_id: str,
    request: Request,
    bg_tasks: BackgroundTasks,
    db: AsyncSession = Depends(get_db)
) -> WebhookResponse:
    \"\"\"Receives inbound WhatsApp messages from Twilio sandbox/production.\"\"\"
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

    if not Body.strip():
        # Do not throw a 400, otherwise Twilio logs a webhook error.
        # Just ignore empty messages (e.g. image-only) gracefully for now.
        return WebhookResponse(status="ignored", from_number=From.replace("whatsapp:", ""), label="empty_body", reply_queued=False)

    # Strip Twilio's "whatsapp:" prefix to get a clean phone number
    sender_phone = From.replace("whatsapp:", "").strip()
    sender_name = ProfileName or sender_phone"""

if old_signature in content:
    content = content.replace(old_signature, new_signature)
    with open(file_path, "w") as f:
        f.write(content)
    print("Replaced successfully!")
else:
    print("Old signature not found!")
