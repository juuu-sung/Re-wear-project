from datetime import datetime, date
from app.services.db_service import (
    get_user_clothes,
    get_last_wash,
    get_wear_events,
)
from app.services.push_service import send_push


# -------------------------------------------
# 1) 소재/카테고리 기준 세탁 필요 횟수
# -------------------------------------------
THRESHOLDS = {
    "cotton":     {"상의": 2, "하의": 4, "아우터": 7},
    "nylon":      {"상의": 3, "하의": 4, "아우터": 8},
    "polyester":  {"상의": 3, "하의": 4, "아우터": 8},
    "rayon":      {"상의": 2, "하의": 3, "아우터": 6},
    "spandex":    {"상의": 2, "하의": 3, "아우터": 5},
    "synthetic":  {"상의": 3, "하의": 4, "아우터": 8},
    "wool":       {"상의": 5, "하의": 6, "아우터": 15},
}

SILK_THRESHOLD = 3


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
    results = []

    for cloth in clothes:
        # 마지막 세탁 기록 가져오기
        last_wash = get_last_wash(db, cloth.id)
        last_wash_date = to_safe_date(last_wash.date) if last_wash else None

        # 착용 기록
        wear_events = get_wear_events(db, cloth.id)

        # 안전 필터링
        filtered_wears = filter_wears_after(wear_events, last_wash_date)

        # 평가
        info = evaluate_single_cloth(cloth, filtered_wears)

        if info["need_wash"]:
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
