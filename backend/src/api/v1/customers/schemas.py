from typing import Optional
from pydantic import BaseModel, Field
from datetime import datetime

class CustomerBase(BaseModel):
    name: str
    company: Optional[str] = None
    email: Optional[str] = None
    phone: Optional[str] = None
    status: str = "Active"
    total_value: float = 0.0

class CustomerCreate(CustomerBase):
    pass

class CustomerResponse(CustomerBase):
    id: str
    created_at: datetime
    date: Optional[datetime] = Field(default=None, alias="created_at")

    class Config:
        from_attributes = True
        populate_by_name = True

