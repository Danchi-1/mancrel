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
    from_name = Column(String, nullable=True)
    company = Column(String, nullable=True)
    subject = Column(String, nullable=True)
    preview = Column(Text, nullable=True)
    full_text = Column(Text, nullable=False)
    time = Column(String, nullable=True) # E.g., "10:45 AM"
    unread = Column(Boolean, default=True)
    sentiment = Column(String, default="neutral")
    ai_suggestion_confidence = Column(Float, nullable=True)
    ai_suggestion_text = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
