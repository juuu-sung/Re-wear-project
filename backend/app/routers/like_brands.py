from fastapi import APIRouter, Depends, Body
from sqlalchemy.orm import Session
from app.db import get_db
from app.models.like_brands import LikedBrand

router = APIRouter(prefix="/v1/brands", tags=["brands"])

# ---------------------------------------------------------
#  좋아요 추가 (POST)
# ---------------------------------------------------------
@router.post("/like")
def like_brand(
    user_id: int = Body(...),
    brand_name: str = Body(...),
    db: Session = Depends(get_db)
):
    exist = db.query(LikedBrand).filter(
        LikedBrand.user_id == user_id,
        LikedBrand.brand_name == brand_name
    ).first()

    if exist:
        return {"status": "exists"}

    new_item = LikedBrand(
        user_id=user_id,
        brand_name=brand_name,
    )
    db.add(new_item)
    db.commit()
    db.refresh(new_item)

    return {"status": "liked", "id": new_item.id}

# ---------------------------------------------------------
#  좋아요 취소 (DELETE)
# ---------------------------------------------------------
@router.delete("/like")
def unlike_brand(
    user_id: int = Body(...),
    brand_name: str = Body(...),
    db: Session = Depends(get_db)
):
    item = db.query(LikedBrand).filter(
        LikedBrand.user_id == user_id,
        LikedBrand.brand_name == brand_name
    ).first()

    if not item:
        return {"status": "not_found"}

    db.delete(item)
    db.commit()

    return {"status": "unliked"}

# ---------------------------------------------------------
#  좋아요 리스트 불러오기
# ---------------------------------------------------------
@router.get("/liked")
def get_liked_brands(user_id: int, db: Session = Depends(get_db)):
    items = db.query(LikedBrand).filter(
        LikedBrand.user_id == user_id
    ).all()

    return [i.brand_name for i in items]
