from typing import Optional
from pydantic import BaseModel
from datetime import datetime

class OrderUpdate(BaseModel):
    status: Optional[str] = None
    tracking_number: Optional[str] = None

class OrderResponse(BaseModel):
    id: str
    customer_name: str
    customer_phone: str
    items_summary: str
    total_amount: float
    status: str
    tracking_number: Optional[str] = None
    created_at: datetime

    class Config:
        from_attributes = True
