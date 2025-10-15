from pydantic import BaseModel

class ClothesBase(BaseModel):
    name: str
    category: str

class ClothesCreate(ClothesBase):
    pass

class ClothesOut(ClothesBase):
    id: int
    image_path: str | None

    class Config:
        orm_mode = True
