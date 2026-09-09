"""모델의 한글 카테고리와 기존 세탁 주기 계산용 큰 분류."""

import json
from pathlib import Path

_CONFIG = Path(__file__).resolve().parents[1] / "models/multitask_config.json"
_CATEGORIES = json.loads(_CONFIG.read_text(encoding="utf-8"))["categories"]
CATEGORY_LABELS = tuple(item["label"] for item in _CATEGORIES)
_GROUPS = {item["label"]: item["group"] for item in _CATEGORIES}


def category_group(category: str) -> str:
    # 기존 큰 분류와 사용자 정의 카테고리는 기존 동작을 유지한다.
    return _GROUPS.get(category, category)
