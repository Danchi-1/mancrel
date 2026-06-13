from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from sqlalchemy import func

from db.session import get_db
from db.models import Message
from .schemas import AnalyticsDashboardResponse
from api.v1.auth.deps import get_current_user

router = APIRouter(prefix="/analytics", tags=["Analytics"])

@router.get("/dashboard", response_model=AnalyticsDashboardResponse)
async def get_dashboard(db: AsyncSession = Depends(get_db), current_user = Depends(get_current_user)):
    # Total Inbound
    inbound_res = await db.execute(
        select(func.count(Message.id)).where(
            Message.user_id == current_user.id,
            Message.direction == "inbound"
        )
    )
    total_inbound = inbound_res.scalar() or 0
    
    # Total Outbound AI
    outbound_res = await db.execute(
        select(func.count(Message.id)).where(
            Message.user_id == current_user.id,
            Message.direction == "outbound"
        )
    )
    total_outbound = outbound_res.scalar() or 0
    
    ai_handling_rate = 0.0
    if total_inbound > 0:
        # We cap it at 100% just in case outbound > inbound
        ai_handling_rate = min((total_outbound / total_inbound) * 100, 100.0)
        
    # Sentiment Breakdown
    sentiment_res = await db.execute(
        select(Message.sentiment, func.count(Message.id))
        .where(Message.user_id == current_user.id, Message.direction == "inbound")
        .group_by(Message.sentiment)
    )
    sentiment_counts = sentiment_res.all()
    
    sentiment_breakdown = []
    colors = {
        "positive": "#10B981", # emerald-500
        "neutral": "#9CA3AF",  # gray-400
        "concern": "#EF4444",  # red-500
        "frustrated": "#DC2626", # red-600
        "negative": "#DC2626", # red-600
    }
    
    for sentiment, count in sentiment_counts:
        s_val = sentiment or "neutral"
        sentiment_breakdown.append({
            "name": s_val.capitalize(),
            "value": count,
            "fill": colors.get(s_val.lower(), "#9CA3AF")
        })
        
    # Attention Required (Recent frustrated/concern messages)
    attention_res = await db.execute(
        select(Message)
        .where(
            Message.user_id == current_user.id,
            Message.direction == "inbound",
            Message.sentiment.in_(["concern", "frustrated", "negative"])
        )
        .order_by(Message.created_at.desc())
        .limit(10)
    )
    attention_messages = attention_res.scalars().all()
    
    # Dedup by phone
    seen_phones = set()
    attention_required = []
    for msg in attention_messages:
        if msg.sender_phone not in seen_phones:
            seen_phones.add(msg.sender_phone)
            attention_required.append({
                "id": msg.id,
                "name": msg.from_name or msg.sender_phone,
                "phone": msg.sender_phone,
                "last_message": msg.full_text[:100] + "..." if len(msg.full_text) > 100 else msg.full_text,
                "time": msg.time or msg.created_at.strftime("%I:%M %p")
            })
            
    return {
        "total_inbound": total_inbound,
        "total_outbound_ai": total_outbound,
        "ai_handling_rate": ai_handling_rate,
        "sentiment_breakdown": sentiment_breakdown,
        "attention_required": attention_required
    }
