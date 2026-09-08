from sqlalchemy import Column, Integer, String, Date, ForeignKey, DateTime, func
from sqlalchemy.orm import relationship
from app.db import Base

class ClothingActivity(Base):
    __tablename__ = "clothing_activities"

    id = Column(Integer, primary_key=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    clothes_id = Column(Integer, ForeignKey("clothes.id"), nullable=False)

    activity_type = Column(String(20), nullable=False)  # "WEAR" | "LAUNDRY"
    activity_date = Column(Date, nullable=False)
    created_at = Column(DateTime, default=func.now(), nullable=False)

    # 관계
    user = relationship("User", back_populates="clothing_activities")
    clothes = relationship("Clothes", back_populates="clothing_activities")
