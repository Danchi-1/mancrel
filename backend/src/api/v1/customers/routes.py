from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from typing import List

from db.session import get_db
from db.models import Customer
from .schemas import CustomerResponse
from api.v1.auth.deps import get_current_user

router = APIRouter(prefix="/customers", tags=["Customers"])

@router.get("", response_model=List[CustomerResponse])
async def get_customers(db: AsyncSession = Depends(get_db), current_user = Depends(get_current_user)):
    stmt = select(Customer)
    result = await db.execute(stmt)
    return result.scalars().all()
