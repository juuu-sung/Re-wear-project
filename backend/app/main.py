from fastapi import FastAPI, Depends
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import List
from datetime import date, datetime
from pathlib import Path
from fastapi.staticfiles import StaticFiles
from dotenv import load_dotenv
import asyncio

from app.db import Base, SessionLocal
from app.routers import (
    event as event_router,
    user as user_router,
    auth as auth_router,
    infer as infer_router,
    clothes as clothes_router,
    news as news_router,
    infer_material as infer_material_router,
    care as care_router
    
)

from alembic import command
from alembic.config import Config
from app.core.scheduler import start_scheduler, stop_scheduler
from app.services.material_infer import warmup                   # ← 모델 로드
app = FastAPI(title="ReWear API", version="0.1.0")
app.mount("/uploads", StaticFiles(directory="uploads"), name="uploads")

load_dotenv()

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


# --- CORS 설정 (임시 전체 허용) ---
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # 추후 "http://localhost:19006" 등으로 제한 가능
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
    guide: dict  # {"wash": "...", "dry": "...", "iron": "...", "bleach": "..."}


class MaterialResp(BaseModel):
    material: str  # 최종 예측 (예: "wool_knit")
    topk: List[List]  # [["wool_knit", 0.81], ["cotton_knit", 0.12]]


# ---------- Endpoints ----------
@app.get("/healthz")
def healthz():
    return {"ok": True}


@app.post("/infer/label", response_model=LabelGuide)
def infer_label(img: Img):
    # TODO: YOLO 기반 라벨 인식 모델로 교체
    return {
        "labels": [{"code": "W30", "name": "Machine wash 30℃", "confidence": 0.93}],
        "guide": {
            "wash": "30℃ 중성세제 사용",
            "dry": "건조기 금지, 평건 권장",
            "iron": "저온 다림질",
            "bleach": "불가",
        },
    }


@app.post("/infer/material", response_model=MaterialResp)
def infer_material(img: Img):
    # TODO: EfficientNet 기반 소재 분류 모델로 교체
    return {"material": "wool_knit", "topk": [["wool_knit", 0.81], ["cotton_knit", 0.12]]}


@app.get("/test-db")
def test_db(db: Session = Depends(get_db)):
    result = db.connection().exec_driver_sql("SELECT 1").scalar()
    return {"db_result": result}

@app.on_event("startup")
async def startup_event():
    loop = asyncio.get_running_loop()  # ← 현재 이벤트 루프 획득
    start_scheduler(loop)              # ← loop 전달

@app.on_event("shutdown")
async def on_shutdown():
    stop_scheduler()

@app.on_event("startup")
async def startup_event():
    # 1) 모델 로드
    warmup()
    # 2) 뉴스 스케줄러 시작
    loop = asyncio.get_running_loop()
    start_scheduler(loop)

@app.on_event("shutdown")
async def shutdown_event():
    stop_scheduler()


# ---------- Router 등록 ----------
app.include_router(user_router.router)       
app.include_router(auth_router.router)       
app.include_router(event_router.router)
app.include_router(infer_router.router, prefix="/infer", tags=["infer"])
app.include_router(clothes_router.router)
app.include_router(news_router.router)
app.include_router(infer_material_router.router)
app.include_router(care_router.router)