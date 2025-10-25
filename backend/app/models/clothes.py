from sqlalchemy import Column, Integer, String, ForeignKey, Text
from sqlalchemy.orm import relationship
from app.db import Base

class Clothes(Base):
    __tablename__ = "clothes"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)
    category = Column(String, nullable=False)
    image_path = Column(String, nullable=True)
    user_id = Column(Integer, ForeignKey("users.id"))

    user = relationship("User", back_populates="clothes")
    events = relationship("Event", back_populates="clothes", cascade="all, delete")

    material = Column(String(100), nullable=True)
    washing_info = Column(Text, nullable=True)     # JSON 문자열 보관해도 됨
    material_breakdown = Column(Text, nullable=True)  # JSON 문자열 (top5 등)
    care_summary = Column(Text, nullable=True)
