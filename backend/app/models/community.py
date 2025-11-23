# app/models/community.py
from sqlalchemy import Column, Integer, String, ForeignKey, Boolean, DateTime, func
from sqlalchemy.orm import relationship
from app.db import Base

class ReformPost(Base):
    __tablename__ = "reform_posts"

    id = Column(Integer, primary_key=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    description = Column(String)
    category = Column(String)
    created_at = Column(DateTime, server_default=func.now())

    user = relationship("User", back_populates="reform_posts")
    images = relationship("ReformImage", cascade="all, delete")
    likes = relationship("ReformLike", cascade="all, delete")
    comments = relationship("ReformComment", cascade="all, delete")


class ReformImage(Base):
    __tablename__ = "reform_images"

    id = Column(Integer, primary_key=True)
    post_id = Column(Integer, ForeignKey("reform_posts.id"))
    image_url = Column(String)
    is_before = Column(Boolean, default=False)


class ReformLike(Base):
    __tablename__ = "reform_likes"

    id = Column(Integer, primary_key=True)
    post_id = Column(Integer, ForeignKey("reform_posts.id"))
    user_id = Column(Integer, ForeignKey("users.id"))

    user = relationship("User", back_populates="reform_likes")


class ReformComment(Base):
    __tablename__ = "reform_comments"

    id = Column(Integer, primary_key=True)
    post_id = Column(Integer, ForeignKey("reform_posts.id"))
    user_id = Column(Integer, ForeignKey("users.id"))
    comment = Column(String)
    created_at = Column(DateTime, server_default=func.now())

    user = relationship("User", back_populates="reform_comments")
