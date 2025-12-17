# backend/app/routers/clothing_activity.py

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from datetime import date
from app.db import get_db
from app.models import ClothingActivity, LaundryBasket
from app.routers.auth import get_current_user

router = APIRouter(
    prefix="/clothing-activities",
    tags=["ClothingActivity"]
)

@router.post("")
def create_activity(
    clothes_id: int,
    activity_type: str,  # "WEAR" | "LAUNDRY"
    activity_date: date,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    """
    의류 활동 로그 생성 API
    - WEAR: 착용 기록
    - LAUNDRY: 세탁 기록 (세탁바구니 자동 제거)
    """

    activity = ClothingActivity(
        user_id=current_user.id,
        clothes_id=clothes_id,
        activity_type=activity_type,
        activity_date=activity_date,
    )
    db.add(activity)

    #   세탁 기록이면 세탁바구니에서 자동 제거
    if activity_type == ["LAUNDRY","WASH"]:
        db.query(LaundryBasket).filter(
            LaundryBasket.user_id == current_user.id,
            LaundryBasket.clothes_id == clothes_id,
        ).delete()

    db.commit()
    return {"ok": True}
