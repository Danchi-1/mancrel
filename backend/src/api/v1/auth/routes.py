from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
import httpx
import secrets

from db.session import get_db
from db.models import User
from core.security import get_password_hash, verify_password, create_access_token
from .schemas import UserCreate, UserLogin, Token, UserResponse, WhatsAppConnectRequest
from .deps import get_current_user

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

