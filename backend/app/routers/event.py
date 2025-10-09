# backend/app/routers/event.py

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from typing import List

# 1. 우리가 만든 schemas와 crud, 그리고 공용 db.py를 import 합니다.
from .. import crud, schemas
from ..db import get_db

# 2. API 경로와 태그를 설정합니다. (v1을 경로에 포함)
router = APIRouter(
    prefix="/v1", 
    tags=["events"]
)

# --- POST /v1/events API ---
# 우리가 schemas/event.py에 정의한 ClothingActivityCreate를 사용합니다.
@router.post("/events", response_model=schemas.ClothingActivity)
def create_activity_for_user(
    activity: schemas.ClothingActivityCreate, 
    db: Session = Depends(get_db)
    # user: models.User = Depends(get_current_user) # 추후 로그인 기능 연동
):
    user_id = 1 # 임시 사용자 ID
    # 우리가 crud/event.py에 만든 함수를 호출합니다.
    return crud.create_user_activity(db=db, activity=activity, user_id=user_id)


# --- GET /v1/calendar API ---
# 우리가 schemas/event.py에 정의한 ClothingActivity를 리스트 형태로 반환합니다.
@router.get("/calendar", response_model=List[schemas.ClothingActivity])
def read_activities_for_calendar(
    db: Session = Depends(get_db)
    # user: models.User = Depends(get_current_user) # 추후 로그인 기능 연동
):
    user_id = 1 # 임시 사용자 ID
    # 우리가 crud/event.py에 만든 함수를 호출합니다.
    return crud.get_activities_by_user(db, user_id=user_id)