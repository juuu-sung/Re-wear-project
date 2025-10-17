from fastapi import APIRouter
import feedparser
import requests
import datetime
import random
import urllib.parse

router = APIRouter(prefix="/v1/news", tags=["news"])

NEWS_CACHE = {"date": None, "articles": []}

@router.get("/")
async def get_daily_news():
    today = datetime.date.today().isoformat()

    # ✅ 하루 한 번만 캐시
    if NEWS_CACHE["date"] == today and NEWS_CACHE["articles"]:
        return NEWS_CACHE["articles"]

    try:
        keywords = [
            "지속가능한 패션",
            "패션 환경",
            "업사이클링 의류",
            "친환경 패션",
            "슬로우 패션",
        ]

        all_articles = []

        for kw in keywords:
            encoded_kw = urllib.parse.quote(kw)
            rss_url = f"https://news.google.com/rss/search?q={encoded_kw}&hl=ko&gl=KR&ceid=KR:ko"

            headers = {"User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)"}
            res = requests.get(rss_url, headers=headers, timeout=10)

            feed = feedparser.parse(res.text)
            print(f"[RSS] '{kw}' 기사 {len(feed.entries)}개 수집됨")

            for entry in feed.entries[:5]:
                all_articles.append({
                    "title": entry.title,
                    "summary": entry.get("summary", ""),
                    "url": entry.link,
                    "published": entry.get("published", ""),
                })

        # ✅ 중복 제거
        unique_articles = list({a["title"]: a for a in all_articles}.values())

        # ✅ 기사 없을 경우 예비 기사 사용
        if not unique_articles:
            print("[뉴스 자동화] ⚠️ 기사 없음 → 예비 기사 사용")
            fallback = [
                {
                    "title": "패션과 환경의 만남, 지속 가능한 트렌드",
                    "summary": "친환경 소재를 활용한 브랜드가 주목받고 있다.",
                    "url": "https://news.google.com",
                    "published": today,
                },
                {
                    "title": "업사이클링으로 다시 태어난 의류",
                    "summary": "패션 산업의 환경 문제 해결을 위한 시도가 이어지고 있다.",
                    "url": "https://news.google.com",
                    "published": today,
                },
            ]
            NEWS_CACHE["date"] = today
            NEWS_CACHE["articles"] = fallback
            return fallback

        # ✅ 기사 4~5개 랜덤 선택
        num_articles = random.randint(4, 5)
        selected = random.sample(unique_articles, k=min(num_articles, len(unique_articles)))

        NEWS_CACHE["date"] = today
        NEWS_CACHE["articles"] = selected

        print(f"[뉴스 자동화] ✅ {len(selected)}개 기사 업데이트됨 ({today})")
        return selected

    except Exception as e:
        print(f"[뉴스 자동화 오류] {e}")
        return {"error": str(e)}
