from sqlalchemy import Column, Integer, String, DateTime, func
from app.db import Base
from sqlalchemy.orm import relationship
class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    email = Column(String(255), unique=True, index=True, nullable=False)
    name = Column(String(100), nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False)
    password_hash = Column(String(255), nullable=False)

    clothes = relationship("Clothes", back_populates="user", cascade="all, delete")
    events = relationship("Event", back_populates="user", cascade="all, delete")