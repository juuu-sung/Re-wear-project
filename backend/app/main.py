# backend/app/main.py
from fastapi import FastAPI, Depends
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from pydantic import BaseModel, field_validator
from typing import List, Literal, Optional
from datetime import date, datetime
from pathlib import Path

from app.db import Base, SessionLocal
from app.routers import event as event_router, user as user_router, auth as auth_router

from alembic import command
from alembic.config import Config
app = FastAPI(title="ReWear API", version="0.1.0")

# DB 세션 의존성
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


def run_migrations():
    backend_dir = Path(__file__).resolve().parents[1]
    cfg = Config(str(backend_dir / "alembic.ini"))
    command.upgrade(cfg, "head")

# --- CORS: 초기 개발 단계라 전체 허용(추후 도메인 제한) ---
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # e.g. ["http://localhost:19006"] 로 좁히기 가능
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ---------- Schemas ----------
class Img(BaseModel):
    image_base64: str

class Label(BaseModel):
    code: str
    name: str
    confidence: float

class LabelGuide(BaseModel):
    labels: List[Label]
    guide: dict  # {"wash": "...", "dry":"...", "iron":"...", "bleach":"..."}

class MaterialResp(BaseModel):
    material: str                 # 최종 예측 (예: "wool_knit")
    topk: List[List]              # [["wool_knit", 0.81], ["cotton_knit", 0.12]]

# ---------- Endpoints ----------
@app.get("/healthz")
def healthz():
    return {"ok": True}

@app.post("/infer/label", response_model=LabelGuide)
def infer_label(img: Img):
    # TODO: 추후 YOLO/라벨 인식 모델로 교체
    return {
        "labels": [
            {"code": "W30", "name": "Machine wash 30℃", "confidence": 0.93}
        ],
        "guide": {
            "wash": "30℃ 중성세제 사용",
            "dry": "건조기 금지, 평건 권장",
            "iron": "저온 다림질",
            "bleach": "불가"
        }
    }

@app.post("/infer/material", response_model=MaterialResp)
def infer_material(img: Img):
    # TODO: 추후 EfficientNet/소재 분류 모델로 교체
    return {"material": "wool_knit", "topk": [["wool_knit", 0.81], ["cotton_knit", 0.12]]}

@app.get("/test-db")
def test_db(db: Session = Depends(get_db)):
    result = db.connection().exec_driver_sql("SELECT 1").scalar()
    return {"db_result": result}

@app.on_event("startup")
def on_startup():
    run_migrations()  # 운영/개발 공통으로 안전하게 최신 스키마 적용

app.include_router(user_router.router)
app.include_router(auth_router.router)
app.include_router(event_router.router)