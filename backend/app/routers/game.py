from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from datetime import date

from app.db import get_db
from app.models.game import (
    OwnedAnimal, OwnedObject, PlacedObject,
    ActiveAnimal, UserRP, DailyMissionState
)

router = APIRouter(prefix="/v1/game", tags=["game"])


# ============================================================
# ⭐ 일일 미션 기본 템플릿 (프론트와 동일한 key 유지)
# ============================================================
FIXED_MISSIONS = [
    "login",
    "add_wear",
    "add_wash",
    "add_cloth",
    "touch_friends",
    "read_news",
]


# ============================================================
# ⭐ 0) 미션 초기화 (오늘 날짜 기준)
# ============================================================
def init_missions_if_needed(db: Session, user_id: int):
    today = date.today()

    existing = db.query(DailyMissionState).filter_by(
        user_id=user_id, date=today
    ).all()

    # 이미 만들어진 상태라면 skip
    if existing:
        return

    # 새로 생성
    for key in FIXED_MISSIONS:
        db.add(DailyMissionState(
            user_id=user_id,
            mission_key=key,
            done=(key == "login"),
            claimed=False,
            date=today
        ))

    db.commit()


# ============================================================
# ⭐ 1) 전체 로드
# ============================================================
@router.get("/load/{user_id}")
def load_game(user_id: int, db: Session = Depends(get_db)):

    # 미션 자동 초기화
    init_missions_if_needed(db, user_id)

    animals = db.query(OwnedAnimal).filter_by(user_id=user_id).all()
    objects = db.query(OwnedObject).filter_by(user_id=user_id).all()
    placed = db.query(PlacedObject).filter_by(user_id=user_id).all()
    active = db.query(ActiveAnimal).filter_by(user_id=user_id).all()

    rp = db.query(UserRP).filter_by(user_id=user_id).first()
    rp_value = rp.rp if rp else 500

    today = date.today()
    missions = db.query(DailyMissionState).filter_by(
        user_id=user_id, date=today
    ).all()

    mission_state = [
        {
            "mission_key": m.mission_key,
            "done": m.done,
            "claimed": m.claimed
        }
        for m in missions
    ]

    return {
        "ownedAnimals": [a.animal_id for a in animals],
        "ownedObjects": [o.object_id for o in objects],
        "placedObjects": [
            {
                "id": p.id,
                "object_id": p.object_id,
                "x": p.x,
                "y": p.y,
                "scale": p.scale
            } for p in placed
        ],
        "activeAnimals": [a.animal_id for a in active],
        "rp": rp_value,
        "missions": mission_state,
    }


# ============================================================
# ⭐ 2) 동물 구매
# ============================================================
@router.post("/buy/animal")
def buy_animal(user_id: int, animal_id: int, db: Session = Depends(get_db)):
    db.add(OwnedAnimal(user_id=user_id, animal_id=animal_id))
    db.commit()
    return {"status": "ok"}


# ============================================================
# ⭐ 3) 구조물 구매
# ============================================================
@router.post("/buy/object")
def buy_object(user_id: int, object_id: int, db: Session = Depends(get_db)):
    db.add(OwnedObject(user_id=user_id, object_id=object_id))
    db.commit()
    return {"status": "ok"}


# ============================================================
# ⭐ 4) 구조물 설치
# ============================================================
@router.post("/place")
def place_object(user_id: int, object_id: int, x: float, y: float, scale: float, db: Session = Depends(get_db)):
    db.add(PlacedObject(
        user_id=user_id,
        object_id=object_id,
        x=x, y=y, scale=scale
    ))
    db.commit()
    return {"status": "ok"}


# ============================================================
# ⭐ 5) 활성화된 동물 저장
# ============================================================
@router.post("/active/set")
def set_active_animals(user_id: int, animals: list[int], db: Session = Depends(get_db)):
    db.query(ActiveAnimal).filter_by(user_id=user_id).delete()

    for a in animals:
        db.add(ActiveAnimal(user_id=user_id, animal_id=a))

    db.commit()
    return {"status": "ok"}


# ============================================================
# ⭐ 6) RP 업데이트
# ============================================================
@router.post("/rp/set")
def update_rp(user_id: int, rp: int, db: Session = Depends(get_db)):
    record = db.query(UserRP).filter_by(user_id=user_id).first()
    if not record:
        db.add(UserRP(user_id=user_id, rp=rp))
    else:
        record.rp = rp

    db.commit()
    return {"status": "ok"}


# ============================================================
# ⭐ 7) 미션 업데이트 (done / claimed)
# ============================================================
@router.post("/mission/update")
def update_mission(user_id: int, mission_key: str, done: bool, claimed: bool, db: Session = Depends(get_db)):
    today = date.today()

    record = db.query(DailyMissionState).filter_by(
        user_id=user_id, mission_key=mission_key, date=today
    ).first()

    if not record:
        record = DailyMissionState(
            user_id=user_id,
            mission_key=mission_key,
            done=done,
            claimed=claimed,
            date=today
        )
        db.add(record)
    else:
        record.done = done
        record.claimed = claimed

    db.commit()
    return {"status": "ok"}
