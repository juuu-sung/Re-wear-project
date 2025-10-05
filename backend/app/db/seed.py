# app/db/seed.py
from datetime import date
from sqlalchemy import select
from app.db import SessionLocal
from app.models.user import User
from app.models.event import Event

def up():
    db = SessionLocal()
    try:
        # 유저 시드
        if not db.execute(select(User).where(User.email == "demo@rewear.app")).scalar_one_or_none():
            demo = User(email="demo@rewear.app", name="Demo")
            db.add(demo)
            db.commit()
            db.refresh(demo)
        else:
            demo = db.execute(select(User).where(User.email=="demo@rewear.app")).scalar_one()

        # 이벤트 시드(중복 방지)
        exists = db.execute(
            select(Event).where(Event.user_id==demo.id, Event.date==date.today())
        ).scalar_one_or_none()
        if not exists:
            db.add_all([
                Event(user_id=demo.id, garment_id=None, type="wear", date=date.today()),
                Event(user_id=demo.id, garment_id=None, type="wash", date=date.today()),
            ])
            db.commit()
        print("[seed] done")
    finally:
        db.close()

if __name__ == "__main__":
    up()
