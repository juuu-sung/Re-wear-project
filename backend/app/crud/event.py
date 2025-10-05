# backend/app/crud/event.py

from sqlalchemy.orm import Session
from .. import models, schemas

# --- 특정 사용자의 모든 활동 기록을 가져오는 함수 ---
def get_activities_by_user(db: Session, user_id: int):
    return db.query(models.ClothingActivity).filter(models.ClothingActivity.user_id == user_id).all()

# --- 새로운 활동 기록(착용/세탁)을 생성하는 함수 ---
def create_user_activity(db: Session, activity: schemas.ClothingActivityCreate, user_id: int):
    # Pydantic 모델을 SQLAlchemy 모델로 변환
    db_activity = models.ClothingActivity(
        **activity.dict(), 
        user_id=user_id
    )
    db.add(db_activity) # DB 세션에 추가
    db.commit()      # DB에 최종 저장
    db.refresh(db_activity) # 저장된 객체를 새로고침하여 ID 등 최신 정보 가져오기
    return db_activity