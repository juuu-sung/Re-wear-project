from sqlalchemy import Column, Integer, String, Boolean, Float, ForeignKey, Date
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from datetime import date
from app.db import Base

class OwnedAnimal(Base):
    __tablename__ = "owned_animals"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    animal_id = Column(Integer)

    user = relationship("User", back_populates="owned_animals")


class OwnedObject(Base):
    __tablename__ = "owned_objects"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    object_id = Column(Integer)

    user = relationship("User", back_populates="owned_objects")


class PlacedObject(Base):
    __tablename__ = "placed_objects"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    object_id = Column(Integer)
    x = Column(Float)
    y = Column(Float)
    scale = Column(Float)

    user = relationship("User", back_populates="placed_objects")


class ActiveAnimal(Base):
    __tablename__ = "active_animals"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    animal_id = Column(Integer)

    user = relationship("User", back_populates="active_animals")


class UserRP(Base):
    __tablename__ = "user_rp"

    user_id = Column(Integer, ForeignKey("users.id"), primary_key=True)
    rp = Column(Integer, default=500)

    user = relationship("User", back_populates="user_rp")


class DailyMissionState(Base):
    __tablename__ = "daily_mission_state"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    mission_key = Column(String, index=True)
    done = Column(Boolean, default=False)
    claimed = Column(Boolean, default=False)
    date = Column(Date, default=func.current_date())

    user = relationship("User", back_populates="daily_mission_state")
