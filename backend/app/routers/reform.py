# app/routers/reform.py
from fastapi import APIRouter, HTTPException
from app.utils.youtube import fetch_youtube_results

router = APIRouter(prefix="/v1/reform", tags=["reform"])


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
# 유튜브 검색어 생성 (랜덤 제거됨)
# ======================================
def make_query(mode, src, tgt):
    if mode == "convert":
        return f"{src} {tgt} 리폼"
    return f"{src} 리폼"


# ======================================
# 필터링
# ======================================
def filter_results(mode, src, tgt, items):
    results = []
    src = src.lower()

    for item in items:
        text = (item["title"] + " " + item["description"]).lower()

        if mode == "convert":
            if src in text and tgt.lower() in text:
                results.append(item)

        elif mode == "single":
            if src in text:
                results.append(item)

    return results


# ======================================
# 기본 추천
# ======================================
@router.get("/")
def reform_default(pageToken: str = None, r: float = None):
    q = "의류 리폼"

    raw = fetch_youtube_results(q, pageToken, cache_bust=r)

    return {
        "results": raw["results"],
        "nextPageToken": raw["nextPageToken"],
    }


# ======================================
# 검색 API
# ======================================
@router.get("/search")
def reform_search(query: str, pageToken: str = None, r: float = None):
    mode, src, tgt = parse_query(query)
    search_q = make_query(mode, src, tgt)

    # 🔍 디버깅 로그
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
