from sqlalchemy import Column, Integer, String, Date, ForeignKey
from sqlalchemy.orm import relationship
from app.db import Base

class Event(Base):
    __tablename__ = "events"

    id = Column(Integer, primary_key=True, index=True)
    date = Column(Date, nullable=False)
    type = Column(String, nullable=False)
    garment_id = Column(Integer, ForeignKey("clothes.id"), nullable=False)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    description = Column(String, nullable=True)
    image_url = Column(String, nullable=True)

    # ✅ 관계 설정 (명시적 foreign_keys 추가)
    user = relationship("User", back_populates="events")
    clothes = relationship("Clothes", back_populates="events", foreign_keys=[garment_id])
