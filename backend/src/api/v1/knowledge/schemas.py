from typing import Optional
from pydantic import BaseModel
from datetime import datetime

class KnowledgeItemBase(BaseModel):
    title: str
    content: str
    type: str

class KnowledgeItemCreate(KnowledgeItemBase):
    pass

class KnowledgeItemUpdate(BaseModel):
    title: Optional[str] = None
    content: Optional[str] = None
    type: Optional[str] = None

class KnowledgeItemResponse(KnowledgeItemBase):
    id: str
    created_at: datetime

    class Config:
        from_attributes = True
