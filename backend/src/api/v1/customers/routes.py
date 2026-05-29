from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from sqlalchemy import func
from typing import List

from db.session import get_db
from db.models import Customer, Deal, Message
from .schemas import CustomerResponse
from api.v1.auth.deps import get_current_user

router = APIRouter(prefix="/customers", tags=["Customers"])

@router.get("", response_model=List[CustomerResponse])
async def get_customers(db: AsyncSession = Depends(get_db), current_user = Depends(get_current_user)):
    stmt = select(Customer).where(Customer.user_id == current_user.id).order_by(Customer.created_at.desc())
    result = await db.execute(stmt)
    return result.scalars().all()

@router.get("/stats")
async def get_dashboard_stats(db: AsyncSession = Depends(get_db), current_user = Depends(get_current_user)):
    # Total Contacts
    contacts_result = await db.execute(select(func.count(Customer.id)).where(Customer.user_id == current_user.id))
    total_contacts = contacts_result.scalar() or 0
    
    # Active Deals
    deals_result = await db.execute(
        select(func.count(Deal.id)).where(
            Deal.user_id == current_user.id,
            Deal.status != 'Closed Lost'
        )
    )
    active_deals = deals_result.scalar() or 0
    
    # AI Interactions
    interactions_result = await db.execute(
        select(func.count(Message.id)).where(Message.user_id == current_user.id)
    )
    ai_interactions = interactions_result.scalar() or 0
    
    return {
        "total_contacts": total_contacts,
        "active_deals": active_deals,
        "ai_interactions": ai_interactions
    }
