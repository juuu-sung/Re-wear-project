# app/repositories/events_repo.py
from typing import Iterable, Optional, Tuple, Dict
from datetime import date
from calendar import monthrange
from sqlalchemy import select, func
from sqlalchemy.orm import Session
from app.models.event import Event


#  이벤트 생성 (프론트 데이터 구조 반영)
def create_event(
    db: Session,
    *,
    user_id: int,
    garment_id: Optional[int],
    type: str,
    date_: date,
    description: Optional[str] = None,
    image_url: Optional[str] = None,
) -> Event:
    row = Event(
        user_id=user_id,
        garment_id=garment_id,
        type=type,
        date=date_,
        description=description,
        image_url=image_url,
    )
    db.add(row)
    db.commit()
    print(" [repo] commit 완료")
    db.refresh(row)
    print(" [repo] refresh 완료 → id:", row.id)
    return row


#  이벤트 전체 목록 (유저별)
def list_events(db: Session, *, user_id: Optional[int] = None) -> Iterable[Event]:
    stmt = select(Event).order_by(Event.date.desc(), Event.id.desc())
    if user_id is not None:
        stmt = stmt.where(Event.user_id == user_id)
    return db.execute(stmt).scalars().all()


#  월 범위 계산 함수
def _month_bounds(year: int, month: int) -> Tuple[date, date]:
    """해당 월의 (첫날, 마지막날) 반환"""
    last = monthrange(year, month)[1]
    return date(year, month, 1), date(year, month, last)


#  해당 월의 wear/wash 날짜 집계 (캘린더 표시용)
def aggregate_month(db: Session, *, user_id: int, year: int, month: int) -> Tuple[list[str], list[str]]:
    """해당 월의 wear/wash 날짜 리스트를 반환"""
    start, end = _month_bounds(year, month)
    stmt = (
        select(Event.type, Event.date)
        .where(Event.user_id == user_id, Event.date.between(start, end))
        .order_by(Event.date.asc())
    )
    wear, wash = [], []
    for t, d in db.execute(stmt):
        (wear if t == "wear" else wash).append(d.isoformat())
    return wear, wash


#  통계: 특정 시점 이후 타입별 개수 (선택적 기능)
def count_by_type(db: Session, *, user_id: int, since: date) -> Dict[str, int]:
    stmt = (
        select(Event.type, func.count(Event.id))
        .where(Event.user_id == user_id, Event.date >= since)
        .group_by(Event.type)
    )
    return {t: c for t, c in db.execute(stmt)}
