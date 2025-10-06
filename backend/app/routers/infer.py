from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, field_validator
import os, base64, io
from PIL import Image

# 실/더미 토글
INFER_MODE = os.getenv("INFER_MODE", "demo").lower()  # "demo" | "real"

router = APIRouter(prefix="/infer", tags=["infer"])

class InferReq(BaseModel):
    image_base64: str
    @field_validator("image_base64")
    @classmethod
    def not_empty(cls, v):
        if not v or not isinstance(v, str):
            raise ValueError("image_base64 is required")
        return v

def b64_to_rgb_image(b64: str):
    try:
        raw = base64.b64decode(b64.split(",")[-1])
        from PIL import Image
        return Image.open(io.BytesIO(raw)).convert("RGB")
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid base64 image")

# --- 실제 모델 연결부(원하면 services/로 분리) ---
def _predict_label_real(img):
    # TODO: 전처리 → 모델 추론 → 후처리
    return "tshirt", 0.88

def _predict_materials_real(img):
    # TODO: 전처리 → 모델 추론 → 후처리
    return [
        {"name": "polyester", "confidence": 0.73},
        {"name": "cotton", "confidence": 0.24},
        {"name": "nylon", "confidence": 0.03},
    ]

@router.post("/label")
def infer_label(req: InferReq):
    img = b64_to_rgb_image(req.image_base64)
    if INFER_MODE == "demo":
        return {"ok": True, "label": "tshirt", "confidence": 0.91, "mode": "demo"}
    label, conf = _predict_label_real(img)
    return {"ok": True, "label": label, "confidence": float(conf), "mode": "real"}

@router.post("/material")
def infer_material(req: InferReq):
    img = b64_to_rgb_image(req.image_base64)
    if INFER_MODE == "demo":
        mats = [{"name": "polyester", "confidence": 0.77}, {"name": "cotton", "confidence": 0.21}]
        return {"ok": True, "materials": mats, "primary": mats[0]["name"], "mode": "demo"}
    mats = _predict_materials_real(img)
    primary = max(mats, key=lambda m: m["confidence"])["name"] if mats else None
    return {"ok": True, "materials": mats, "primary": primary, "mode": "real"}
