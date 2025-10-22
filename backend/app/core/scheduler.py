# app/core/scheduler.py
from __future__ import annotations

import asyncio
from datetime import datetime
from typing import Optional

from apscheduler.schedulers.background import BackgroundScheduler

from app.routers.news import get_daily_news, NEWS_CACHE

_scheduler: Optional[BackgroundScheduler] = None
_loop: Optional[asyncio.AbstractEventLoop] = None


def _refresh_news_job():
    """스케줄러 스레드에서 실행 → FastAPI 메인 이벤트 루프로 코루틴 위임."""
    if _loop is None:
        print("[Scheduler] ⚠️ 이벤트 루프가 아직 준비되지 않았습니다.")
        return

    # FastAPI의 메인 이벤트 루프에 코루틴 실행 예약
    fut = asyncio.run_coroutine_threadsafe(get_daily_news(refresh=1), _loop)
    try:
        fut.result(timeout=30)  # 예외 전파 및 타임아웃 설정
        print(
            f"[Scheduler] ✅ 뉴스 갱신 완료 {datetime.now()} "
            f"(count={len(NEWS_CACHE.get('articles', []))})"
        )
    except Exception as e:
        print(f"[Scheduler] ⚠️ 뉴스 갱신 실패: {e}")


def start_scheduler(loop: asyncio.AbstractEventLoop):
    """FastAPI startup에서 현재 이벤트 루프를 주입해 호출."""
    global _scheduler, _loop
    if _scheduler:
        return

    _loop = loop
    _scheduler = BackgroundScheduler(timezone="Asia/Seoul")

    # ✅ 6시간마다 뉴스 자동 갱신
    _scheduler.add_job(
        _refresh_news_job,
        trigger="interval",
        hours=6,
        id="refresh_news",
        coalesce=True,           # 밀린 작업 합치기
        max_instances=1,         # 중복 실행 방지
        misfire_grace_time=300,  # 5분까지 지연 허용
    )

    _scheduler.start()
    print("[Scheduler] ✅ 뉴스 자동 갱신 스케줄러 시작됨 (6시간 주기)")

    # 서버 부팅 직후 1회 즉시 캐시 채우기
    asyncio.run_coroutine_threadsafe(get_daily_news(refresh=1), _loop)


def stop_scheduler():
    """FastAPI 종료 시 호출."""
    global _scheduler
    if _scheduler:
        _scheduler.shutdown(wait=False)
        _scheduler = None
        print("[Scheduler] ⏹️ 스케줄러 중지됨")
