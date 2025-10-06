    # backend/app/services/label_infer.py
# 실제 모델 붙일 자리. 우선 더미 로직만 작성.
from typing import Tuple
from PIL import Image

_model = None  # lazy load용

def _load_model():
    global _model
    if _model is None:
        # TODO: 여기서 EfficientNet 등 가중치 로드
        _model = "loaded"
    return _model

def predict_label(img: Image.Image) -> Tuple[str, float]:
    _load_model()
    # TODO: 전처리 -> model(img) -> 후처리
    # 임시 반환값 (실모델 붙이면 삭제)
    return "tshirt", 0.88
