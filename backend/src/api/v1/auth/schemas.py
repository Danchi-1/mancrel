from typing import Optional
from pydantic import BaseModel, EmailStr

class UserCreate(BaseModel):
    first_name: str
    last_name: str
    business_name: str
    email: EmailStr
    phone: Optional[str] = None
    industry_sector: str
    business_type: str
    password: str
    marketing_consent: bool
    terms_accepted: bool

class UserLogin(BaseModel):
    email: EmailStr
    password: str

class Token(BaseModel):
    access_token: str
    token_type: str

class UserResponse(BaseModel):
    id: str
    first_name: str
    last_name: str
    email: str
    business_name: Optional[str] = None
    whatsapp_connected: bool = False

    class Config:
        from_attributes = True

class WhatsAppConnectRequest(BaseModel):
    phone_number_id: str
    access_token: str
    business_account_id: str

