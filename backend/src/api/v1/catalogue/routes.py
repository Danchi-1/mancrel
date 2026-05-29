from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from sqlalchemy import func
from typing import List

from db.session import get_db
from db.models import User, CatalogueItem
from api.v1.auth.deps import get_current_user
from .schemas import CatalogueItemCreate, CatalogueItemUpdate, CatalogueItemResponse
from .upload import router as upload_router

router = APIRouter(prefix="/catalogue", tags=["Catalogue"])
router.include_router(upload_router)

MAX_CATALOGUE_ITEMS = 20

@router.get("/", response_model=List[CatalogueItemResponse])
async def get_catalogue_items(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get all catalogue items for the current business."""
    result = await db.execute(
        select(CatalogueItem).where(CatalogueItem.user_id == current_user.id).order_by(CatalogueItem.created_at.desc())
    )
    items = result.scalars().all()
    return items

@router.post("/", response_model=CatalogueItemResponse, status_code=status.HTTP_201_CREATED)
async def create_catalogue_item(
    payload: CatalogueItemCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Create a new catalogue item (limit 20 per business)."""
    # Enforce limit
    count_result = await db.execute(
        select(func.count(CatalogueItem.id)).where(CatalogueItem.user_id == current_user.id)
    )
    count = count_result.scalar() or 0
    if count >= MAX_CATALOGUE_ITEMS:
        raise HTTPException(
            status_code=400,
            detail=f"You have reached the maximum limit of {MAX_CATALOGUE_ITEMS} catalogue items."
        )

    new_item = CatalogueItem(
        user_id=current_user.id,
        name=payload.name,
        price=payload.price,
        available=payload.available,
        description=payload.description,
        sku=payload.sku,
        image_url=payload.image_url
    )
    db.add(new_item)
    await db.commit()
    await db.refresh(new_item)
    return new_item

@router.put("/{item_id}", response_model=CatalogueItemResponse)
async def update_catalogue_item(
    item_id: str,
    payload: CatalogueItemUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Update a specific catalogue item."""
    result = await db.execute(
        select(CatalogueItem).where(CatalogueItem.id == item_id, CatalogueItem.user_id == current_user.id)
    )
    item = result.scalar_one_or_none()
    if not item:
        raise HTTPException(status_code=404, detail="Catalogue item not found.")

    update_data = payload.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        setattr(item, key, value)

    await db.commit()
    await db.refresh(item)
    return item

@router.delete("/{item_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_catalogue_item(
    item_id: str,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Delete a catalogue item."""
    result = await db.execute(
        select(CatalogueItem).where(CatalogueItem.id == item_id, CatalogueItem.user_id == current_user.id)
    )
    item = result.scalar_one_or_none()
    if not item:
        raise HTTPException(status_code=404, detail="Catalogue item not found.")

    await db.delete(item)
    await db.commit()
    return None
