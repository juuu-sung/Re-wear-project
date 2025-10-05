# app/repositories/events_repo.py
from typing import Iterable, Optional, Tuple, Dict
from datetime import date
from calendar import monthrange

from sqlalchemy import select, func
from sqlalchemy.orm import Session

from app.models.event import Event


def create_event(
    db: Session, *, user_id: int, garment_id: Optional[int], type: str, date_: date
) -> Event:
    row = Event(user_id=user_id, garment_id=garment_id, type=type, date=date_)
    db.add(row)
    db.commit()
    db.refresh(row)
    return row


def list_events(db: Session, *, user_id: Optional[int] = None) -> Iterable[Event]:
    stmt = select(Event).order_by(Event.date.desc(), Event.id.desc())
    if user_id is not None:
        stmt = stmt.where(Event.user_id == user_id)
    return db.execute(stmt).scalars().all()


def _month_bounds(year: int, month: int) -> Tuple[date, date]:
    """해당 월의 (첫날, 마지막날) 반환"""
    last = monthrange(year, month)[1]
    return date(year, month, 1), date(year, month, last)


def aggregate_month(db: Session, *, year: int, month: int) -> Tuple[list[str], list[str]]:
    """해당 월의 wear/wash 날짜 리스트를 반환"""
    start, end = _month_bounds(year, month)
    stmt = (
        select(Event.type, Event.date)
        .where(Event.date.between(start, end))     # ✅ DATE 컬럼엔 like 대신 범위 조회
        .order_by(Event.date.asc())
    )
    wear, wash = [], []
    for t, d in db.execute(stmt):
        (wear if t == "wear" else wash).append(d.isoformat())
    return wear, wash


def count_by_type(db: Session, *, user_id: int, since: date) -> Dict[str, int]:
    stmt = (
        select(Event.type, func.count(Event.id))
        .where(Event.user_id == user_id, Event.date >= since)
        .group_by(Event.type)
    )
    return {t: c for t, c in db.execute(stmt)}
