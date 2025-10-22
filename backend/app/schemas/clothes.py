from pydantic import BaseModel

class ClothesBase(BaseModel):
    name: str
    category: str

class ClothesCreate(ClothesBase):
    pass

class ClothesOut(ClothesBase):
    id: int
    image_path: str | None
    material: str | None = None
    washing_info: str | None = None
    material_breakdown: str | None = None

    class Config:
        orm_mode = True
