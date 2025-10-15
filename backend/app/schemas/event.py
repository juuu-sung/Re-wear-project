from pydantic import BaseModel
from datetime import date
from typing import Optional

# 👕 Clothes (옷 정보) 스키마
class ClothesResponse(BaseModel):
    id: int
    name: str
    image_url: Optional[str] = None

    class Config:
        orm_mode = True


# 📅 Event 기본 스키마
class EventBase(BaseModel):
    date: date
    type: str
    garment_id: int


# 📌 생성 시
class EventCreate(EventBase):
    description: Optional[str] = None


# 🛠 수정 시
class EventUpdate(BaseModel):
    date: Optional[date] = None
    type: Optional[str] = None
    garment_id: Optional[int] = None


# 🔍 조회 시 (이제 옷 정보 포함)
class EventResponse(EventBase):
    id: int
    user_id: int
    description: Optional[str] = None
    clothes: Optional[ClothesResponse] = None  # ✅ 옷 이름 + 사진 정보

    class Config:
        orm_mode = True

