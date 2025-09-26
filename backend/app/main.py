# backend/app/main.py
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, field_validator
from typing import List, Literal, Optional
from datetime import date, datetime

app = FastAPI(title="ReWear API", version="0.1.0")

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

class Event(BaseModel):
    user_id: int = 1
    garment_id: Optional[int] = None
    type: Literal["wear", "wash"]
    date: date

    @field_validator("date", mode="before")
    @classmethod
    def parse_date(cls, v):
        # "YYYY-MM-DD" 문자열도 허용
        if isinstance(v, str):
            return datetime.fromisoformat(v).date()
        return v

class CalendarResp(BaseModel):
    wear: List[str]
    wash: List[str]

# ---------- In-memory storage (데모용) ----------
EVENTS: List[Event] = []

# ---------- Endpoints ----------
@app.get("/healthz")
def healthz():
    return {"ok": True}

@app.post("/v1/infer/label", response_model=LabelGuide)
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

@app.post("/v1/infer/material", response_model=MaterialResp)
def infer_material(img: Img):
    # TODO: 추후 EfficientNet/소재 분류 모델로 교체
    return {"material": "wool_knit", "topk": [["wool_knit", 0.81], ["cotton_knit", 0.12]]}

@app.post("/v1/events")
def create_event(ev: Event):
    EVENTS.append(ev)
    return {"ok": True, "count": len(EVENTS)}

@app.get("/v1/calendar", response_model=CalendarResp)
def get_calendar(month: str):
    """month 형식: 'YYYY-MM'"""
    try:
        y, m = map(int, month.split("-"))
    except Exception:
        raise HTTPException(status_code=400, detail="month must be 'YYYY-MM'")

    wear, wash = [], []
    for e in EVENTS:
        if e.date.year == y and e.date.month == m:
            (wear if e.type == "wear" else wash).append(e.date.isoformat())
    return {"wear": wear, "wash": wash}
