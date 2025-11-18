from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.db import get_db
from app.services.alert_service import get_wash_needed

router = APIRouter(prefix="/alerts", tags=["alerts"])


@router.get("/today")
def today_alerts(user_id: int, db: Session = Depends(get_db)):
    """
    홈 화면에서 사용할 오늘의 세탁 알림 API.
    user_id를 받아서 세탁이 필요한 옷 리스트 반환.
    """
    items = get_wash_needed(db, user_id)

    return {
        "count": len(items),
        "items": items
    }
