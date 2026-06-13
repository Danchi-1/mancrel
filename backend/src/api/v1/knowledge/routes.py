from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from typing import List

from db.session import get_db
from db.models import KnowledgeItem
from .schemas import KnowledgeItemCreate, KnowledgeItemUpdate, KnowledgeItemResponse
from api.v1.auth.deps import get_current_user
from api.v1.messaging.vector_db import knowledge_collection

router = APIRouter(prefix="/knowledge", tags=["Knowledge Base"])

@router.get("", response_model=List[KnowledgeItemResponse])
async def get_knowledge_items(db: AsyncSession = Depends(get_db), current_user = Depends(get_current_user)):
    stmt = select(KnowledgeItem).where(KnowledgeItem.user_id == current_user.id)
    result = await db.execute(stmt)
    items = result.scalars().all()
    return items

@router.post("", response_model=KnowledgeItemResponse)
async def create_knowledge_item(item_in: KnowledgeItemCreate, db: AsyncSession = Depends(get_db), current_user = Depends(get_current_user)):
    item = KnowledgeItem(**item_in.model_dump())
    item.user_id = current_user.id
    db.add(item)
    await db.commit()
    await db.refresh(item)
    
    # Upsert into ChromaDB
    # We embed both the title and content so the vector is rich in meaning
    combined_text = f"Title: {item.title}\nContent: {item.content}"
    knowledge_collection.upsert(
        ids=[item.id],
        documents=[combined_text],
        metadatas=[{"user_id": current_user.id, "type": item.type, "title": item.title}]
    )
    
    return item

@router.patch("/{item_id}", response_model=KnowledgeItemResponse)
async def update_knowledge_item(item_id: str, item_update: KnowledgeItemUpdate, db: AsyncSession = Depends(get_db), current_user = Depends(get_current_user)):
    stmt = select(KnowledgeItem).where(KnowledgeItem.id == item_id, KnowledgeItem.user_id == current_user.id)
    result = await db.execute(stmt)
    item = result.scalar_one_or_none()
    
    if not item:
        raise HTTPException(status_code=404, detail="Knowledge item not found")
        
    update_data = item_update.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        setattr(item, key, value)
        
    await db.commit()
    await db.refresh(item)
    
    # Update ChromaDB
    combined_text = f"Title: {item.title}\nContent: {item.content}"
    knowledge_collection.upsert(
        ids=[item.id],
        documents=[combined_text],
        metadatas=[{"user_id": current_user.id, "type": item.type, "title": item.title}]
    )
    
    return item

@router.delete("/{item_id}")
async def delete_knowledge_item(item_id: str, db: AsyncSession = Depends(get_db), current_user = Depends(get_current_user)):
    stmt = select(KnowledgeItem).where(KnowledgeItem.id == item_id, KnowledgeItem.user_id == current_user.id)
    result = await db.execute(stmt)
    item = result.scalar_one_or_none()
    
    if not item:
        raise HTTPException(status_code=404, detail="Knowledge item not found")
        
    await db.delete(item)
    await db.commit()
    
    # Remove from ChromaDB
    try:
        knowledge_collection.delete(ids=[item.id])
    except Exception as e:
        pass # Ignore if not in chromadb
        
    return {"message": "Item deleted successfully"}
