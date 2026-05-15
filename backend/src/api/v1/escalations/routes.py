from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from typing import List

from db.session import get_db
from db.models import Escalation
from .schemas import EscalationResponse
from api.v1.auth.deps import get_current_user

router = APIRouter(prefix="/escalations", tags=["Escalations"])

@router.get("", response_model=List[EscalationResponse])
async def get_escalations(db: AsyncSession = Depends(get_db), current_user = Depends(get_current_user)):
    stmt = select(Escalation)
    result = await db.execute(stmt)
    return result.scalars().all()
