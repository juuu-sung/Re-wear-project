# app/models/event.py
from sqlalchemy import Column, Integer, String, Date, Index, ForeignKey, CheckConstraint
from app.db import Base

class Event(Base):
    __tablename__ = "events"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    garment_id = Column(Integer, nullable=True)
    type = Column(String(16), nullable=False, index=True)  # "wear" | "wash"
    date = Column(Date, nullable=False, index=True)

    __table_args__ = (
        Index("ix_events_user_date", "user_id", "date"),
        CheckConstraint("type IN ('wear','wash')", name="ck_events_type"),  # 선택
    )
