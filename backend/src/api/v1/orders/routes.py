import os
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from typing import List
import httpx

from db.session import get_db
from db.models import Order, User
from .schemas import OrderUpdate, OrderResponse
from api.v1.auth.deps import get_current_user

router = APIRouter(prefix="/orders", tags=["Orders"])

META_API_BASE = os.environ.get("META_API_BASE", "https://graph.facebook.com/v18.0")

@router.get("", response_model=List[OrderResponse])
async def get_orders(db: AsyncSession = Depends(get_db), current_user = Depends(get_current_user)):
    stmt = select(Order).where(Order.user_id == current_user.id).order_by(Order.created_at.desc())
    result = await db.execute(stmt)
    return result.scalars().all()

@router.patch("/{order_id}", response_model=OrderResponse)
async def update_order(order_id: str, update_data: OrderUpdate, db: AsyncSession = Depends(get_db), current_user = Depends(get_current_user)):
    stmt = select(Order).where(Order.id == order_id, Order.user_id == current_user.id)
    result = await db.execute(stmt)
    order = result.scalar_one_or_none()
    
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")
        
    old_status = order.status
    
    # Update fields
    update_dict = update_data.model_dump(exclude_unset=True)
    for key, value in update_dict.items():
        setattr(order, key, value)
        
    # Check if newly shipped
    if old_status != "Shipped" and order.status == "Shipped":
        # Dispatch WhatsApp message to customer
        if current_user.wa_phone_number_id and current_user.wa_access_token:
            tracking_msg = f"Track it here: {order.tracking_number}" if order.tracking_number else "We will notify you once it arrives."
            message_body = f"Great news! Your order for {order.items_summary} has been shipped. {tracking_msg}"
            
            async with httpx.AsyncClient() as client:
                try:
                    await client.post(
                        f"{META_API_BASE}/{current_user.wa_phone_number_id}/messages",
                        headers={
                            "Authorization": f"Bearer {current_user.wa_access_token}",
                            "Content-Type": "application/json",
                        },
                        json={
                            "messaging_product": "whatsapp",
                            "to": order.customer_phone,
                            "type": "text",
                            "text": {"body": message_body},
                        },
                        timeout=10.0,
                    )
                except Exception as e:
                    print(f"Failed to send shipping notification: {e}")
                    
    await db.commit()
    await db.refresh(order)
    return order
