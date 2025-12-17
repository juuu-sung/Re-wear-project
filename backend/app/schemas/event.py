from pydantic import BaseModel
from datetime import date
from typing import Optional, Union

# 👕 Clothes (옷 정보)
class ClothesResponse(BaseModel):
    id: int
    name: str
    image_path: Optional[str] = None

    class Config:
        orm_mode = True


# 📅 Event 기본 스키마
class EventBase(BaseModel):
    date: date
    type: str
    garment_id: int


# 📌 생성용
class EventCreate(EventBase):
    description: Optional[str] = None


# 🛠 수정용 (None은 제외되게 + 문자열 date 허용)
class EventUpdate(BaseModel):
    date: Optional[Union[str, date]] = None
    type: Optional[str] = None
    garment_id: Optional[int] = None
    description: Optional[str] = None


# 🔍 조회용 (Clothes 정보 포함)
class EventResponse(EventBase):
    id: int
    user_id: int
    description: Optional[str] = None
    clothes: Optional[ClothesResponse] = None  #  옷 정보까지 반환

    class Config:
        orm_mode = True
