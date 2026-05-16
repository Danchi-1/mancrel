# SQLAlchemy database models.

from datetime import datetime
import uuid
from sqlalchemy import Column, String, Boolean, DateTime, ForeignKey, Text, Float
from sqlalchemy.orm import declarative_base, relationship

Base = declarative_base()

def generate_uuid():
    return str(uuid.uuid4())

class User(Base):
    __tablename__ = "users"

    id = Column(String, primary_key=True, default=generate_uuid)
    first_name = Column(String, nullable=False)
    last_name = Column(String, nullable=False)
    email = Column(String, unique=True, index=True, nullable=False)
    hashed_password = Column(String, nullable=False)
    phone = Column(String, nullable=True)
    
    # Business info
    business_name = Column(String, nullable=True)
    industry_sector = Column(String, nullable=True)
    business_type = Column(String, nullable=True)
    
    # Flags
    is_active = Column(Boolean, default=True)
    marketing_consent = Column(Boolean, default=False)
    terms_accepted = Column(Boolean, default=False)
    whatsapp_connected = Column(Boolean, default=False)

    # WhatsApp Business (Meta Cloud API) credentials — stored per user
    wa_phone_number_id = Column(String, nullable=True)    # Meta Phone Number ID
    wa_access_token = Column(String, nullable=True)       # Meta permanent access token
    wa_business_account_id = Column(String, nullable=True)  # WABA ID
    wa_webhook_verify_token = Column(String, nullable=True)  # random secret for webhook verification
    
    created_at = Column(DateTime, default=datetime.utcnow)

class Customer(Base):
    __tablename__ = "customers"
    
    id = Column(String, primary_key=True, default=generate_uuid)
    name = Column(String, nullable=False)
    email = Column(String, nullable=True)
    phone = Column(String, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

class Deal(Base):
    __tablename__ = "deals"
    
    id = Column(String, primary_key=True, default=generate_uuid)
    company = Column(String, nullable=False)
    value = Column(Float, default=0.0)
    contact_name = Column(String, nullable=True)
    probability = Column(Float, default=0.0)
    status = Column(String, default="prospect") # prospect, qualified, proposal, negotiation
    created_at = Column(DateTime, default=datetime.utcnow)

class Escalation(Base):
    __tablename__ = "escalations"
    
    id = Column(String, primary_key=True, default=generate_uuid)
    customer_name = Column(String, nullable=False)
    issue_type = Column(String, nullable=False)
    channel = Column(String, nullable=False) # email, api, phone
    assigned_to = Column(String, nullable=True)
    status = Column(String, default="Open") # Open, Resolved
    date = Column(DateTime, default=datetime.utcnow)

class Message(Base):
    __tablename__ = "messages"
    
    id = Column(String, primary_key=True, default=generate_uuid)
    # Conversation tracking
    sender_phone = Column(String, nullable=True, index=True)  # e.g. "+2348012345678"
    direction = Column(String, default="inbound")              # "inbound" | "outbound"
    wa_message_id = Column(String, nullable=True, unique=True) # Meta message ID (dedup)
    # Display fields
    from_name = Column(String, nullable=True)
    company = Column(String, nullable=True)
    subject = Column(String, nullable=True)
    preview = Column(Text, nullable=True)
    full_text = Column(Text, nullable=False)
    time = Column(String, nullable=True)
    unread = Column(Boolean, default=True)
    sentiment = Column(String, default="neutral")
    ai_suggestion_confidence = Column(Float, nullable=True)
    ai_suggestion_text = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
