from typing import Optional
from pydantic import BaseModel
from datetime import datetime

class DealBase(BaseModel):
    company: str
    value: float
    contact_name: Optional[str] = None
    probability: float
    status: str

class DealCreate(DealBase):
    pass

class DealUpdate(BaseModel):
    company: Optional[str] = None
    value: Optional[float] = None
    contact_name: Optional[str] = None
    probability: Optional[float] = None
    status: Optional[str] = None

class DealResponse(DealBase):
    id: str
    created_at: datetime

    class Config:
        from_attributes = True
