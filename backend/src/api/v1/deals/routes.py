from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from typing import List

from db.session import get_db
from db.models import Deal
from .schemas import DealCreate, DealUpdate, DealResponse
from api.v1.auth.deps import get_current_user

router = APIRouter(prefix="/deals", tags=["Deals"])

@router.get("", response_model=List[DealResponse])
async def get_deals(db: AsyncSession = Depends(get_db), current_user = Depends(get_current_user)):
    stmt = select(Deal)
    result = await db.execute(stmt)
    deals = result.scalars().all()
    return deals

@router.post("", response_model=DealResponse)
async def create_deal(deal_in: DealCreate, db: AsyncSession = Depends(get_db), current_user = Depends(get_current_user)):
    deal = Deal(**deal_in.model_dump())
    db.add(deal)
    await db.commit()
    await db.refresh(deal)
    return deal

@router.patch("/{deal_id}", response_model=DealResponse)
async def update_deal(deal_id: str, deal_update: DealUpdate, db: AsyncSession = Depends(get_db), current_user = Depends(get_current_user)):
    stmt = select(Deal).where(Deal.id == deal_id)
    result = await db.execute(stmt)
    deal = result.scalar_one_or_none()
    
    if not deal:
        raise HTTPException(status_code=404, detail="Deal not found")
        
    update_data = deal_update.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        setattr(deal, key, value)
        
    await db.commit()
    await db.refresh(deal)
    return deal
