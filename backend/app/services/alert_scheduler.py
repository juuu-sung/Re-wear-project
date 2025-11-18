from apscheduler.schedulers.asyncio import AsyncIOScheduler
from sqlalchemy.orm import sessionmaker
from app.db import engine
from app.services.alert_service import get_wash_needed
from app.services.push_service import send_push

SessionLocal = sessionmaker(bind=engine, autocommit=False, autoflush=False)
scheduler = AsyncIOScheduler()


def daily_push_job():
    db = SessionLocal()
    user_ids = db.execute("SELECT id FROM users").scalars().all()

    for uid in user_ids:
        needed = get_wash_needed(db, uid)

        if len(needed) > 0:
            send_push(
                uid,
                "Re:wear",
                "세탁이 필요한 옷이 있어요. 앱에서 확인해 주세요."
            )

    db.close()


def start_alert_scheduler(loop):
    scheduler.add_job(daily_push_job, "cron", hour=9, minute=0)
    scheduler.start()


def stop_alert_scheduler():
    scheduler.shutdown()
