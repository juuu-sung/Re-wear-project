# app/routers/event.py
from datetime import date
from typing import Optional, Literal
from fastapi import APIRouter, Depends
from pydantic import BaseModel
from sqlalchemy.orm import Session
from app.db import SessionLocal
from app.repositories import events_repo as repo

router = APIRouter(prefix="/events", tags=["events"])

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

class EventIn(BaseModel):
    user_id: int = 1
    garment_id: Optional[int] = None
    type: Literal["wear", "wash"] 
    date: date

@router.post("")
def create_event(payload: EventIn, db: Session = Depends(get_db)):
    row = repo.create_event(
        db, user_id=payload.user_id, garment_id=payload.garment_id, type=payload.type, date_=payload.date
    )
    return {"ok": True, "id": row.id}

@router.get("")
def list_events(user_id: Optional[int] = None, db: Session = Depends(get_db)):
    return repo.list_events(db, user_id=user_id)

@router.get("/calendar")
def calendar(month: str, db: Session = Depends(get_db)):
    y, m = map(int, month.split("-"))
    wear, wash = repo.aggregate_month(db, year=y, month=m)
    return {"wear": wear, "wash": wash}
