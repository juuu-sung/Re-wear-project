from pydantic import BaseModel, EmailStr, Field, constr
from typing import Optional
from datetime import datetime

class UserBase(BaseModel):
    email: EmailStr = Field(..., example="user@example.com")
    name: Optional[str] = Field(None, example="홍주성")
    

class UserCreate(UserBase):
    pass

class UserUpdate(BaseModel):
    name: Optional[str] = None

class UserOut(BaseModel):
    id: int
    email: EmailStr
    name: str | None = None
    class Config:
        from_attributes = True  # SQLAlchemy 객체 직렬화 허용


class RegisterIn(BaseModel):
    name: constr(strip_whitespace=True, min_length=1, max_length=50)
    email: EmailStr
    password: constr(min_length=8, max_length=72)

class TokenOut(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user_id: int