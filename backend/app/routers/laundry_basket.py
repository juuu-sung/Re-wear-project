# backend/app/routers/laundry_basket.py

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session, joinedload
from app.db import get_db
from app import models
from app.routers.auth import get_current_user

router = APIRouter(
    prefix="/laundry-basket",
    tags=["LaundryBasket"]
)

#  세탁바구니 조회
@router.get("")
def get_basket(
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    return (
        db.query(models.LaundryBasket)
        .options(joinedload(models.LaundryBasket.clothes))
        .filter(models.LaundryBasket.user_id == current_user.id)
        .order_by(models.LaundryBasket.created_at.desc())
        .all()
    )

#  세탁바구니에 담기
@router.post("/{clothes_id}")
def add_to_basket(
    clothes_id: int,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    exists = db.query(models.LaundryBasket).filter(
        models.LaundryBasket.user_id == current_user.id,
        models.LaundryBasket.clothes_id == clothes_id,
    ).first()

    if exists:
        return {"ok": True}

    basket = models.LaundryBasket(
        user_id=current_user.id,
        clothes_id=clothes_id,
    )
    db.add(basket)
    db.commit()
    return {"ok": True}
