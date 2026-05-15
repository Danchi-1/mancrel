from typing import Optional
from pydantic import BaseModel
from datetime import datetime

class EscalationBase(BaseModel):
    customer_name: str
    issue_type: str
    priority: str
    assigned_to: Optional[str] = None
    status: str = "Open"

class EscalationCreate(EscalationBase):
    pass

class EscalationResponse(EscalationBase):
    id: str
    date: datetime

    class Config:
        from_attributes = True
