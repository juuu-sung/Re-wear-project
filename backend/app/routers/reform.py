# app/routers/reform.py
from fastapi import APIRouter, HTTPException
from app.utils.youtube import fetch_youtube_results
import random

router = APIRouter(prefix="/v1/reform", tags=["reform"])

# ======================================
# 🔥 랜덤 카테고리 목록
# ======================================
CATEGORIES = [
    "업사이클링 옷", "업사이클링 패션", "DIY 의류",
    "리메이크 옷", "리폼 아이디어", "재활용 의류",
    "슬로우패션 리폼", "의류 리폼", "의류 업사이클링",
    "옷 업사이클링", "옷 리폼"
]

# ======================================
# 검색어 분석
# ======================================
def parse_query(q: str):
    parts = q.strip().split()

    if len(parts) == 1:
        return "single", parts[0], None

    if len(parts) == 2:
        return "convert", parts[0], parts[1]

    return "invalid", None, None


# ======================================
# 검색어 생성 (리폼 + 업사이클링 + DIY + 리메이크)
# ======================================
def make_query(mode, src, tgt):
    base_keywords = "리폼 업사이클링 DIY 리메이크"

    if mode == "convert":
        return f"{src} {tgt} {base_keywords}"

    return f"{src} {base_keywords}"


# ======================================
# 필터링 (리폼/업사이클링/DIY/리메이크 포함)
# ======================================
def filter_results(mode, src, tgt, items):
    results = []
    src = src.lower()
    tgt = tgt.lower() if tgt else None

    for item in items:
        text = (item["title"] + " " + item["description"]).lower()

        keywords = (
            "리폼" in text or 
            "업사이클링" in text or "upcycle" in text or
            "diy" in text or
            "리메이크" in text or "remake" in text
        )

        if mode == "convert":
            if (src in text and tgt in text) or keywords:
                results.append(item)

        elif mode == "single":
            if src in text or keywords:
                results.append(item)

    return results


# ======================================
# ⭐ 기본 추천 (랜덤 카테고리)
# ======================================
@router.get("/")
def reform_default(pageToken: str = None, r: float = None):

    # 카테고리 한 번 선택
    category = random.choice(CATEGORIES)

    q = f"{category} 리폼 업사이클링 DIY 리메이크"

    # 우선 50개 정도 긁어오기 (API max 50)
    raw = fetch_youtube_results(q, pageToken, cache_bust=r)

    # 결과에서 랜덤 10개 추출
    pool = raw["results"]
    random.shuffle(pool)

    selected = pool[:10]  # 🔥 여기서 랜덤 영상 10개 보내기

    return {
        "category": category,
        "results": selected,
        "nextPageToken": raw["nextPageToken"],
    }


# ======================================
# ⭐ 검색 API
# ======================================
@router.get("/search")
def reform_search(query: str, pageToken: str = None, r: float = None):
    mode, src, tgt = parse_query(query)
    search_q = make_query(mode, src, tgt)

    print("\n========== SEARCH DEBUG ==========")
    print("MODE:", mode)
    print("SRC:", src)
    print("TGT:", tgt)
    print("FINAL QUERY:", search_q)

    if mode == "invalid":
        raise HTTPException(
            status_code=400,
            detail="검색 형식: '원본 목표' 또는 '원본' 형태로 입력해주세요. 예: '셔츠 치마'"
        )

    raw = fetch_youtube_results(search_q, pageToken, cache_bust=r)
    filtered = filter_results(mode, src, tgt, raw["results"])

    return {
        "results": filtered,
        "nextPageToken": raw["nextPageToken"],
    }
