from sqlalchemy import Column, Integer, String, ForeignKey, DateTime, Boolean, Text, UniqueConstraint
from sqlalchemy.orm import relationship
from sqlalchemy.dialects.postgresql import JSON
from datetime import datetime
from app.db import Base


class ChatRoom(Base):
    __tablename__ = "chat_rooms"

    id = Column(Integer, primary_key=True, index=True)
    user1_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    user2_id = Column(Integer, ForeignKey("users.id"), nullable=False)

    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow)

    __table_args__ = (
        UniqueConstraint("user1_id", "user2_id", name="unique_chat_room"),
    )

    messages = relationship("ChatMessage", back_populates="room", cascade="all, delete")


class ChatMessage(Base):
    __tablename__ = "chat_messages"

    id = Column(Integer, primary_key=True, index=True)
    room_id = Column(Integer, ForeignKey("chat_rooms.id"), nullable=False)
    sender_id = Column(Integer, ForeignKey("users.id"), nullable=False)

    # 텍스트 메시지
    message = Column(Text, nullable=True)

    # 🔥 단일 이미지 · 단일 영상
    media_url = Column(String, nullable=True)
    thumbnail_url = Column(String, nullable=True)
    media_type = Column(String, nullable=True)  # text / image / video / multi-image

    # 🔥 멀티 이미지(JSON 배열)
    media_urls = Column(JSON, nullable=True)  # ["url1", "url2", ...]

    read = Column(Boolean, default=False)
    created_at = Column(DateTime, default=datetime.utcnow)

    room = relationship("ChatRoom", back_populates="messages")
