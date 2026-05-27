from typing import Optional
from pydantic import BaseModel
from datetime import datetime

class CatalogueItemBase(BaseModel):
    name: str
    price: Optional[str] = None
    available: bool = True
    description: Optional[str] = None
    sku: Optional[str] = None

class CatalogueItemCreate(CatalogueItemBase):
    pass

class CatalogueItemUpdate(CatalogueItemBase):
    name: Optional[str] = None

class CatalogueItemResponse(CatalogueItemBase):
    id: str
    user_id: str
    created_at: datetime

    class Config:
        from_attributes = True
