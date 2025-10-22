# app/services/wash_guide.py
def guide_for(material: str) -> dict:
    m = (material or "").lower()

    # 아주 얕은 기본값
    g = {
        "wash": "중성세제, 찬물 손세탁 권장",
        "dry": "그늘에서 평건/자연건조",
        "iron": "저온 다림질(천 대고)",
        "bleach": "표백제 사용 금지",
    }

    if "wool" in m or "울" in m:
        g.update({
            "wash": "울 코스/울 전용 세제, 미지근한 물",
            "dry": "짜지 말고 수건으로 물기 제거 후 평건",
            "iron": "저온 스팀",
        })
    elif "silk" in m or "실크" in m:
        g.update({
            "wash": "실크 전용 세제, 미지근한 물 손세탁(혹은 드라이)",
            "iron": "아주 저온, 안쪽에서 천 대고",
        })
    elif "cotton" in m or "면" in m:
        g.update({
            "wash": "30℃ 중성세제, 세탁망 권장",
            "iron": "중온",
        })
    elif "nylon" in m or "polyester" in m or "폴리에스터" in m:
        g.update({
            "wash": "30℃ 약한 코스, 섬유유연제 과다 사용 금지",
            "iron": "저온(필요 시)",
        })
    return g
