from sqlalchemy import Column, Integer, String, Boolean, Float, ForeignKey, Date
from sqlalchemy.orm import relationship
from datetime import date
from sqlalchemy.sql import func
from app.db import Base

# ================================
# ✔ 구매한 동물
# ================================
class OwnedAnimal(Base):
    __tablename__ = "owned_animals"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    animal_id = Column(Integer)


# ================================
# ✔ 구매한 구조물
# ================================
class OwnedObject(Base):
    __tablename__ = "owned_objects"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    object_id = Column(Integer)


# ================================
# ✔ 배치된 구조물
# ================================
class PlacedObject(Base):
    __tablename__ = "placed_objects"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    object_id = Column(Integer)
    x = Column(Float)
    y = Column(Float)
    scale = Column(Float)


# ================================
# ✔ 활성화된 동물
# ================================
class ActiveAnimal(Base):
    __tablename__ = "active_animals"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    animal_id = Column(Integer)


# ================================
# ✔ 사용자 RP
# ================================
class UserRP(Base):
    __tablename__ = "user_rp"

    user_id = Column(Integer, ForeignKey("users.id"), primary_key=True)
    rp = Column(Integer, default=500)


# ================================
# ✔ 일일 미션 상태
# ================================
class DailyMissionState(Base):
    __tablename__ = "daily_mission_state"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    mission_key = Column(String, index=True)
    done = Column(Boolean, default=False)
    claimed = Column(Boolean, default=False)
    date = Column(Date, default=func.current_date())  # ⭐ 문제 해결
