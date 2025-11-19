from pydantic import BaseModel

class BrandToggle(BaseModel):
    user_id: int
    brand_name: str
