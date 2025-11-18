from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session, joinedload
from datetime import datetime
from app.db import get_db
from app import models, schemas
from app.routers.auth import get_current_user
from app.services.alert_service import check_and_notify_immediately  


router = APIRouter(prefix="/events", tags=["Events"])


# ✅ 이벤트 생성
@router.post("", response_model=schemas.EventResponse)
def create_event(
    event: schemas.EventCreate,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    db_event = models.Event(**event.dict(), user_id=current_user.id)
    db.add(db_event)
    db.commit()
    db.refresh(db_event)

    # 🔥 wear/wash 기록이 추가된 즉시 n회 체크 + 필요시 즉시 푸시 알림
    check_and_notify_immediately(db, current_user.id)

    return db_event


# ✅ 전체 이벤트 조회 (user_id별)
@router.get("", response_model=list[schemas.EventResponse])
def get_events(user_id: int = Query(...), db: Session = Depends(get_db)):
    events = (
        db.query(models.Event)
        .options(joinedload(models.Event.clothes))
        .filter(models.Event.user_id == user_id)
        .all()
    )
    return events


# ✅ 월별 캘린더용
@router.get("/calendar")
def get_calendar(month: str, user_id: int, db: Session = Depends(get_db)):
    year, month = map(int, month.split("-"))
    start = datetime(year, month, 1)
    end = datetime(year + (month == 12), (month % 12) + 1, 1)

    events = (
        db.query(models.Event)
        .filter(models.Event.user_id == user_id)
        .filter(models.Event.date >= start, models.Event.date < end)
        .all()
    )

    wear_dates, wash_dates = set(), set()
    for e in events:
        if e.type == "wear":
            wear_dates.add(e.date.isoformat())
        elif e.type == "wash":
            wash_dates.add(e.date.isoformat())

    return {"wear": list(wear_dates), "wash": list(wash_dates)}


# ✅ 이벤트 수정 (exclude_unset으로 None 무시)
@router.put("/{event_id}", response_model=schemas.EventResponse)
def update_event(
    event_id: int,
    new: schemas.EventUpdate,
    db: Session = Depends(get_db)
):
    db_event = db.query(models.Event).filter(models.Event.id == event_id).first()
    if not db_event:
        raise HTTPException(status_code=404, detail="Event not found")

    update_data = new.dict(exclude_unset=True)  # ✅ None 필드 무시
    for key, value in update_data.items():
        setattr(db_event, key, value)

    try:
        db.commit()
        db.refresh(db_event)
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=str(e))

    return db_event


# ✅ 이벤트 삭제
@router.delete("/{event_id}")
def delete_event(event_id: int, db: Session = Depends(get_db)):
    db_event = db.query(models.Event).filter(models.Event.id == event_id).first()
    if not db_event:
        raise HTTPException(status_code=404, detail="Event not found")
    db.delete(db_event)
    db.commit()
    return {"ok": True}

@router.get("/by-clothes/{garment_id}", response_model=list[schemas.EventResponse])
def get_events_by_clothes(
    garment_id: int,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    events = (
        db.query(models.Event)
        .options(joinedload(models.Event.clothes))
        .filter(
            models.Event.user_id == current_user.id,
            models.Event.garment_id == garment_id,
        )
        .order_by(models.Event.date.desc())
        .all()
    )
    return events
