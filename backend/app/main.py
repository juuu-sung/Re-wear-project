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
from alembic import command
from alembic.config import Config

# Routers
from app.routers import (
    event as event_router,
    user as user_router,
    auth as auth_router,
    infer as infer_router,
    clothes as clothes_router,
    news as news_router,
    infer_material as infer_material_router,
    care as care_router,
    reform as reform_router,
    community as community_router,
    chat as chat_router,
    laundry as laundry_router
)

# Services
from app.core.scheduler import start_scheduler, stop_scheduler
from app.services.material_infer import warmup


# FastAPI 초기화
app = FastAPI(title="ReWear API", version="0.1.0")

# 정적 파일 업로드 경로
app.mount("/uploads", StaticFiles(directory="uploads"), name="uploads")

load_dotenv()


# ---------- DB 세션 의존성 ----------
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


# ---------- CORS 설정 ----------
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],   # 필요하면 이후 제한
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ---------- 헬스 체크 ----------
@app.get("/healthz")
def healthz():
    return {"ok": True}


# ---------- 임시 예측 API ----------
class Img(BaseModel):
    image_base64: str


class Label(BaseModel):
    code: str
    name: str
    confidence: float


class LabelGuide(BaseModel):
    labels: List[Label]
    guide: dict


class MaterialResp(BaseModel):
    material: str
    topk: List[List]


@app.post("/infer/label", response_model=LabelGuide)
def infer_label(img: Img):
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
    return {"material": "wool_knit", "topk": [["wool_knit", 0.81], ["cotton_knit", 0.12]]}


@app.get("/test-db")
def test_db(db: Session = Depends(get_db)):
    result = db.connection().exec_driver_sql("SELECT 1").scalar()
    return {"db_result": result}


# ---------- Startup / Shutdown ----------
@app.on_event("startup")
async def startup_event():
    warmup()                       # 모델 로드
    loop = asyncio.get_running_loop()
    start_scheduler(loop)          # 뉴스 스케줄러 시작


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
app.include_router(reform_router.router)
app.include_router(community_router.router)   # ← 커뮤니티 통합
app.include_router(chat_router.router)
app.include_router(laundry_router.router, prefix="/laundry", tags=["laundry"])