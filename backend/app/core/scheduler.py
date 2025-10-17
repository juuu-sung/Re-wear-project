# app/core/scheduler.py
from apscheduler.schedulers.background import BackgroundScheduler
from app.routers.news import get_daily_news
import asyncio

scheduler = BackgroundScheduler()

def start_scheduler():
    # ✅ 6시간마다 뉴스 자동 갱신
    scheduler.add_job(lambda: asyncio.run(get_daily_news()), "interval", hours=6)
    scheduler.start()
    print("[Scheduler] ✅ 뉴스 자동 갱신 스케줄러 시작됨 (6시간 주기)")
