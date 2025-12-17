# app/models/user.py
from sqlalchemy import Column, Integer, String, DateTime, func, BigInteger
from sqlalchemy.orm import relationship
from app.db import Base

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    email = Column(String(255), unique=True, index=True, nullable=True)
    name = Column(String(100), nullable=True)
    phone_number = Column(String, nullable=True)
    profile_image = Column(String(512), nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False)
    hashed_password = Column(String(255), nullable=True)
    kakao_id = Column(BigInteger, unique=True, index=True, nullable=True)

    # --- 기존 ---
    clothes = relationship("Clothes", back_populates="user", cascade="all, delete")
    events = relationship("Event", back_populates="user", cascade="all, delete")
    liked_brands = relationship("LikedBrand", back_populates="user", cascade="all, delete-orphan")

    # ---   추가된 모든 관계들 ---
    chat_messages = relationship("ChatMessage", back_populates="sender", cascade="all, delete")

    chat_rooms_user1 = relationship(
        "ChatRoom",
        foreign_keys="[ChatRoom.user1_id]",
        back_populates="user1",
        cascade="all, delete"
    )
    chat_rooms_user2 = relationship(
        "ChatRoom",
        foreign_keys="[ChatRoom.user2_id]",
        back_populates="user2",
        cascade="all, delete"
    )

    owned_animals = relationship("OwnedAnimal", back_populates="user", cascade="all, delete")
    owned_objects = relationship("OwnedObject", back_populates="user", cascade="all, delete")
    placed_objects = relationship("PlacedObject", back_populates="user", cascade="all, delete")
    active_animals = relationship("ActiveAnimal", back_populates="user", cascade="all, delete")

    daily_mission_state = relationship("DailyMissionState", back_populates="user", cascade="all, delete")
    user_rp = relationship("UserRP", back_populates="user", cascade="all, delete")

    reform_posts = relationship("ReformPost", back_populates="user", cascade="all, delete")
    reform_comments = relationship("ReformComment", back_populates="user", cascade="all, delete")
    reform_likes = relationship("ReformLike", back_populates="user", cascade="all, delete")
        #  의류 활동 로그 (WEAR / LAUNDRY)
    clothing_activities = relationship(
        "ClothingActivity",
        back_populates="user",
        cascade="all, delete-orphan"
    )

    #  세탁바구니
    laundry_baskets = relationship(
        "LaundryBasket",
        back_populates="user",
        cascade="all, delete-orphan"
    )
