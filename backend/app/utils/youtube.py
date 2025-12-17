# app/utils/youtube.py
import requests
import os

YOUTUBE_API_KEY = os.getenv("YOUTUBE_API_KEY")
BASE_URL = "https://www.googleapis.com/youtube/v3/search"


def fetch_youtube_results(query: str, pageToken: str = None, cache_bust: float = None):
    params = {
        "part": "snippet",
        "q": query,
        "type": "video",
        "maxResults": 10,
        "key": YOUTUBE_API_KEY,
    }

    #   캐싱 우회용 랜덤 파라미터 (검색어에는 영향 없음)
    if cache_bust is not None:
        params["cache_bust"] = cache_bust

    if pageToken:
        params["pageToken"] = pageToken

    res = requests.get(BASE_URL, params=params)
    data = res.json()

    # 🔍 디버깅 로그
    print("\n========== YOUTUBE RAW ==========")
    print("REQUEST PARAMS:", params)
    print("RESPONSE KEYS:", data.keys())
    print("ITEM COUNT:", len(data.get("items", [])))
    print("RAW RESPONSE:", data)

    results = []
    for item in data.get("items", []):
        snippet = item["snippet"]
        results.append({
            "title": snippet["title"],
            "description": snippet.get("description", ""),
            "thumbnail": snippet["thumbnails"]["high"]["url"],
            "url": f"https://www.youtube.com/watch?v={item['id']['videoId']}"
        })

    return {
        "results": results,
        "nextPageToken": data.get("nextPageToken")
    }
