from sqlalchemy import Column, Integer, String, ForeignKey, DateTime, Boolean, Text, UniqueConstraint
from sqlalchemy.orm import relationship
from datetime import datetime
from app.db import Base


class ChatRoom(Base):
    __tablename__ = "chat_rooms"

    id = Column(Integer, primary_key=True, index=True)
    user1_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    user2_id = Column(Integer, ForeignKey("users.id"), nullable=False)

    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow)

    # 중복 DM 방 생성 방지
    __table_args__ = (
        UniqueConstraint("user1_id", "user2_id", name="unique_chat_room"),
    )

    messages = relationship("ChatMessage", back_populates="room", cascade="all, delete")


class ChatMessage(Base):
    __tablename__ = "chat_messages"

    id = Column(Integer, primary_key=True, index=True)
    room_id = Column(Integer, ForeignKey("chat_rooms.id"), nullable=False)
    sender_id = Column(Integer, ForeignKey("users.id"), nullable=False)

    message = Column(Text, nullable=False)
    read = Column(Boolean, default=False)
    created_at = Column(DateTime, default=datetime.utcnow)

    room = relationship("ChatRoom", back_populates="messages")
