from typing import Optional
from pydantic import BaseModel
from datetime import datetime

class CustomerBase(BaseModel):
    name: str
    company: Optional[str] = None
    email: str
    phone: Optional[str] = None
    status: str = "Active"
    total_value: float = 0.0

class CustomerCreate(CustomerBase):
    pass

class CustomerResponse(CustomerBase):
    id: str
    date: datetime

    class Config:
        from_attributes = True
