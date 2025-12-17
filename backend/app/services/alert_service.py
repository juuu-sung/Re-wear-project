from datetime import datetime, date
from app.services.db_service import (
    get_user_clothes,
    get_last_wash,
    get_wear_events,
)
from app.services.push_service import send_push
from app.models import LaundryBasket



# -------------------------------------------
# 1) 소재/카테고리 기준 세탁 필요 횟수
# -------------------------------------------
THRESHOLDS = {
    "cotton": {
        "상의": 2,   # 땀·피지 흡수 큼 → 1~2회 착용 후 세탁 권장
        "하의": 3,   # 직접 접촉 적음
        "아우터": 10 # 외피, 잦은 세탁 불필요
    },
    "nylon": {
        "상의": 3,   # 흡습 낮음, 냄새 누적 느림
        "하의": 4,
        "아우터": 12
    },
    "polyester": {
        "상의": 3,   # 땀 흡수는 낮지만 냄새 잔존 가능
        "하의": 4,
        "아우터": 15
    },
    "rayon": {
        "상의": 2,   # 면보다 더 약하고 땀 흡수 큼
        "하의": 3,
        "아우터": 12
    },
    "spandex": {
        "상의": 2,   # 스트레치 복원력 보호 필요
        "하의": 3,
        "아우터": 8
    },
    "synthetic": {
        "상의": 3,   # 혼방 평균치
        "하의": 4,
        "아우터": 12
    },
    "wool": {
        "상의": 5,   # 항균성·탈취성 우수
        "하의": 7,
        "아우터": 20 # 실제로는 시즌 1~2회 세탁 권장
    },
}

SILK_THRESHOLD = {
    "상의": 3,
    "하의": 4,
    "아우터": 10
}



# -------------------------------------------
# 2) 날짜를 안전하게 date 객체로 변환
#    datetime → date / date → 그대로 date
# -------------------------------------------
def to_safe_date(value):
    if value is None:
        return None
    if isinstance(value, datetime):
        return value.date()
    if isinstance(value, date):
        return value
    return None   # 문자열 등 잘못된 값이면 버림


# -------------------------------------------
# 3) 특정 옷의 wear 기록 중, last_wash 이후 기록만 필터링
# -------------------------------------------
def filter_wears_after(wear_events, last_wash_date):
    if last_wash_date is None:
        return wear_events

    safe_list = []

    for w in wear_events:
        w_date = to_safe_date(w.date)
        if w_date and w_date > last_wash_date:
            safe_list.append(w)

    return safe_list


# -------------------------------------------
# 4) 옷 하나당 세탁 필요 여부 계산
# -------------------------------------------
def evaluate_single_cloth(cloth, wear_events):
    material = cloth.material
    category = cloth.category

    # silk는 독자 규칙
    threshold = SILK_THRESHOLD if material == "silk" else THRESHOLDS.get(material, {}).get(category, 5)

    wear_count = len(wear_events)

    return {
        "garment_id": cloth.id,
        "name": cloth.name,
        "wear_count": wear_count,
        "required": threshold,
        "category": category,
        "material": material,
        "need_wash": wear_count >= threshold
    }


# -------------------------------------------
# 5) 최종 API에서 쓰는 get_wash_needed 함수
# -------------------------------------------
def get_wash_needed(db, user_id: int):
    clothes = get_user_clothes(db, user_id)

    # 🔥 빨래통에 있는 옷 id 목록
    basket_ids = {
        b.clothes_id
        for b in db.query(LaundryBasket)
                  .filter(LaundryBasket.user_id == user_id)
                  .all()
    }

    results = []

    for cloth in clothes:
        last_wash = get_last_wash(db, cloth.id)
        last_wash_date = to_safe_date(last_wash.date) if last_wash else None

        wear_events = get_wear_events(db, cloth.id)
        filtered_wears = filter_wears_after(wear_events, last_wash_date)

        info = evaluate_single_cloth(cloth, filtered_wears)

        #  세탁 필요 + 아직 빨래통에 안 들어간 경우만 알림
        if info["need_wash"] and cloth.id not in basket_ids:
            results.append(info)

    return results



# -------------------------------------------
# 6) 바로 알림 보내기
# -------------------------------------------
def check_and_notify_immediately(db, user_id: int):
    items = get_wash_needed(db, user_id)

    if items:
        send_push(
            user_id,
            "Re:wear",
            "세탁이 필요한 옷이 있어요. 앱에서 확인해주세요."
        )

    return items
