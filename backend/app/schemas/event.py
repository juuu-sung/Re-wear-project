# backend/app/schemas/event.py

from pydantic import BaseModel
from datetime import date

# --- 데이터 생성 시 사용하는 스키마 ---
class ClothingActivityCreate(BaseModel):
    clothing_item_id: int
    activity_type: str # 'WEAR' 또는 'LAUNDRY'
    activity_date: date

# --- 데이터 조회 시 사용하는 스키마 (DB 기본 정보 포함) ---
class ClothingActivity(BaseModel):
    id: int
    user_id: int
    clothing_item_id: int
    activity_type: str
    activity_date: date

    class Config:
        orm_mode = True # SQLAlchemy 모델을 Pydantic 모델로 변환