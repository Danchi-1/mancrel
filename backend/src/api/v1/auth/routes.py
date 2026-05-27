from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
import httpx
import secrets

from db.session import get_db
from db.models import User
from core.security import get_password_hash, verify_password, create_access_token
from .schemas import UserCreate, UserLogin, Token, UserResponse, WhatsAppConnectRequest, GoogleLoginRequest, UserUpdate, TwilioConnectRequest, TwilioVerifyOtpRequest
from .deps import get_current_user

import os
import random
from datetime import datetime, timedelta
from google.oauth2 import id_token
from google.auth.transport import requests

router = APIRouter(prefix="/auth", tags=["Authentication"])

@router.post("/signup", response_model=UserResponse)
async def signup(user_in: UserCreate, db: AsyncSession = Depends(get_db)):
    # Check if user exists
    stmt = select(User).where(User.email == user_in.email)
    result = await db.execute(stmt)
    if result.scalar_one_or_none():
        raise HTTPException(
            status_code=400,
            detail="The user with this email already exists in the system.",
        )
    
    user = User(
        first_name=user_in.first_name,
        last_name=user_in.last_name,
        email=user_in.email,
        phone=user_in.phone,
        business_name=user_in.business_name,
        industry_sector=user_in.industry_sector,
        business_type=user_in.business_type,
        hashed_password=get_password_hash(user_in.password),
        marketing_consent=user_in.marketing_consent,
        terms_accepted=user_in.terms_accepted,
    )
    db.add(user)
    await db.commit()
    await db.refresh(user)
    return user

@router.post("/signin", response_model=Token)
async def signin(user_in: UserLogin, db: AsyncSession = Depends(get_db)):
    stmt = select(User).where(User.email == user_in.email)
    result = await db.execute(stmt)
    user = result.scalar_one_or_none()
    
    if not user or not verify_password(user_in.password, user.hashed_password):
        raise HTTPException(
            status_code=401, detail="Incorrect email or password"
        )
    
    access_token = create_access_token(subject=user.id)
    return {"access_token": access_token, "token_type": "bearer"}

@router.get("/me", response_model=UserResponse)
async def read_users_me(current_user: User = Depends(get_current_user)):
    return current_user

@router.patch("/me", response_model=UserResponse)
async def update_users_me(
    update_data: UserUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    update_dict = update_data.model_dump(exclude_unset=True)
    
    # Security: Do not allow phone number changes if it's already set to prevent WhatsApp connection breakage
    if current_user.phone and "phone" in update_dict:
        update_dict.pop("phone")

    for key, value in update_dict.items():
        setattr(current_user, key, value)
    
    await db.commit()
    await db.refresh(current_user)
    return current_user

@router.patch("/whatsapp/connect", response_model=UserResponse)
async def connect_whatsapp(
    credentials: WhatsAppConnectRequest,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Store Meta WhatsApp Business credentials and verify them by making
    a test call to the Meta Graph API. Generates a random webhook verify token.
    """
    # Validate credentials against Meta Graph API
    test_url = f"https://graph.facebook.com/v19.0/{credentials.phone_number_id}"
    async with httpx.AsyncClient() as client:
        resp = await client.get(
            test_url,
            params={"access_token": credentials.access_token},
            timeout=10.0,
        )
    
    if resp.status_code != 200:
        raise HTTPException(
            status_code=400,
            detail=f"Invalid Meta credentials: {resp.json().get('error', {}).get('message', 'Unknown error')}"
        )
    
    # Store credentials
    current_user.wa_phone_number_id = credentials.phone_number_id
    current_user.wa_access_token = credentials.access_token
    current_user.wa_business_account_id = credentials.business_account_id
    current_user.wa_webhook_verify_token = secrets.token_urlsafe(32)
    current_user.whatsapp_connected = True
    
    await db.commit()
    await db.refresh(current_user)
    return current_user

@router.get("/whatsapp/webhook-info")
async def get_webhook_info(current_user: User = Depends(get_current_user)):
    """Returns the webhook URL and verify token for Meta dashboard setup."""
    import os
    base_url = os.environ.get("API_BASE_URL", "https://mancrel.onrender.com")
    return {
        "webhook_url": f"{base_url}/api/v1/messaging/webhook",
        "verify_token": current_user.wa_webhook_verify_token,
        "phone_number_id": current_user.wa_phone_number_id,
        "connected": current_user.whatsapp_connected,
    }


@router.post("/twilio/send-otp")
async def send_twilio_otp(
    credentials: TwilioConnectRequest,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Sends a 6-digit OTP to the user's registered phone number via WhatsApp
    using the provided Twilio credentials. Proves ownership and Sandbox opt-in.
    """
    if credentials.personal_phone:
        current_user.phone = credentials.personal_phone
        await db.commit()
        await db.refresh(current_user)

    if not current_user.phone:
        raise HTTPException(status_code=400, detail="You must have a registered phone number to verify Twilio.")

    phone_number = credentials.phone_number.replace(" ", "").replace("-", "").replace("(", "").replace(")", "")
    if not phone_number.startswith("whatsapp:"):
        phone_number = f"whatsapp:{phone_number}"
    if not phone_number.startswith("whatsapp:+"):
        phone_number = phone_number.replace("whatsapp:", "whatsapp:+")

    # Generate 6-digit OTP
    otp = str(random.randint(100000, 999999))
    
    # Format target number
    target_phone = current_user.phone.replace(" ", "").replace("-", "").replace("(", "").replace(")", "")
    if not target_phone.startswith("whatsapp:"):
        target_phone = f"whatsapp:{target_phone}"
    if not target_phone.startswith("whatsapp:+"):
        # Very basic fallback if they didn't include a plus, though signup should enforce it
        target_phone = target_phone.replace("whatsapp:", "whatsapp:+")

    # Send message via Twilio API
    url = f"https://api.twilio.com/2010-04-01/Accounts/{credentials.account_sid}/Messages.json"
    async with httpx.AsyncClient() as client:
        resp = await client.post(
            url,
            auth=(credentials.account_sid, credentials.auth_token),
            data={
                "From": phone_number,
                "To": target_phone,
                "Body": f"Your Mancrel verification code is: {otp}"
            },
            timeout=10.0,
        )
    
    if resp.status_code != 201:
        error_msg = resp.json().get('message', 'Unknown error')
        if "outside the 24-hour window" in error_msg or "opt in" in error_msg.lower():
            error_msg = "You must send a 'join' message to the Sandbox number from your personal WhatsApp first!"
        raise HTTPException(
            status_code=400,
            detail=f"Twilio rejected the connection. Did you use the right keys? Error: {error_msg}"
        )

    # Save OTP to DB temporarily (2 minute expiry)
    current_user.phone_verification_code = otp
    current_user.phone_verification_expires_at = datetime.utcnow() + timedelta(minutes=2)
    await db.commit()
    return {"message": "OTP sent successfully"}

@router.post("/twilio/verify-otp", response_model=UserResponse)
async def verify_twilio_otp(
    payload: TwilioVerifyOtpRequest,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Verifies the 6-digit OTP and finalizes saving the Twilio credentials.
    """
    if not current_user.phone_verification_code or payload.code != current_user.phone_verification_code:
        raise HTTPException(status_code=400, detail="Invalid verification code.")

    if current_user.phone_verification_expires_at and datetime.utcnow() > current_user.phone_verification_expires_at:
        raise HTTPException(status_code=400, detail="Verification code has expired. Please request a new one.")

    phone_number = payload.phone_number.replace(" ", "").replace("-", "").replace("(", "").replace(")", "")
    if not phone_number.startswith("whatsapp:"):
        phone_number = f"whatsapp:{phone_number}"
    if not phone_number.startswith("whatsapp:+"):
        phone_number = phone_number.replace("whatsapp:", "whatsapp:+")

    # Valid! Save the credentials.
    current_user.twilio_account_sid = payload.account_sid
    current_user.twilio_auth_token = payload.auth_token
    current_user.twilio_phone_number = phone_number
    current_user.whatsapp_connected = True
    current_user.phone_verification_code = None # Clear it
    current_user.phone_verification_expires_at = None
    
    await db.commit()
    await db.refresh(current_user)
    return current_user

@router.post("/twilio/disconnect", response_model=UserResponse)
async def disconnect_twilio(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Disconnects the user's Twilio WhatsApp integration.
    """
    current_user.twilio_account_sid = None
    current_user.twilio_auth_token = None
    current_user.twilio_phone_number = None
    current_user.wa_webhook_verify_token = None
    current_user.phone_verification_code = None
    current_user.phone_verification_expires_at = None
    current_user.whatsapp_connected = False
    
    await db.commit()
    await db.refresh(current_user)
    return current_user

@router.post("/google", response_model=Token)
async def google_login(request: GoogleLoginRequest, db: AsyncSession = Depends(get_db)):
    """Verifies a Google JWT credential and logs the user in (or creates them)."""
    client_id = os.environ.get("GOOGLE_CLIENT_ID")
    if not client_id:
        raise HTTPException(status_code=400, detail="Google authentication is not configured on the server.")

    try:
        # Verify the token against Google's servers
        idinfo = id_token.verify_oauth2_token(
            request.credential, requests.Request(), client_id
        )
        email = idinfo.get("email")
        if not email:
            raise HTTPException(status_code=400, detail="Google token missing email.")
            
        first_name = idinfo.get("given_name", "User")
        last_name = idinfo.get("family_name", "")

        # Check if user exists
        stmt = select(User).where(User.email == email)
        result = await db.execute(stmt)
        user = result.scalar_one_or_none()

        if not user:
            # Create a new user with Google info
            user = User(
                first_name=first_name,
                last_name=last_name,
                email=email,
                business_name=f"{first_name}'s Business",
                industry_sector="Other",
                business_type="Startup",
                hashed_password=get_password_hash(secrets.token_urlsafe(32)), # Random unguessable password
                marketing_consent=False,
                terms_accepted=True, # Implicitly accepted by logging in with Google
            )
            db.add(user)
            await db.commit()
            await db.refresh(user)

        # Generate standard FastAPI access token
        access_token = create_access_token(subject=str(user.id))
        return {"access_token": access_token, "token_type": "bearer"}

    except Exception as e:
        # Invalid token or network error
        import logging
        logging.error(f"Google auth error: {str(e)}")
        raise HTTPException(status_code=400, detail=f"Google authentication failed: {str(e)}")
