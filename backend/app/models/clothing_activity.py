# backend/app/models/clothing_activity.py

from sqlalchemy import Column, Integer, String, Date, ForeignKey, func, DateTime
from sqlalchemy.orm import relationship

from ..db import Base

class ClothingActivity(Base):
    __tablename__ = 'clothing_activities'

    id = Column(Integer, primary_key=True)
    user_id = Column(Integer, ForeignKey('users.id'), nullable=False)
    clothing_item_id = Column(Integer, ForeignKey('clothing_items.id'), nullable=False)
    activity_type = Column(String(50), nullable=False) # 'WEAR' or 'LAUNDRY'
    activity_date = Column(Date, nullable=False)
    created_at = Column(DateTime, nullable=False, default=func.now())

    # 관계 설정
    user = relationship("User", back_populates="clothing_activities")
    clothing_item = relationship("ClothingItem") # clothing_item 모델에도 관계 설정 필요