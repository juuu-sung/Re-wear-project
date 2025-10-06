# backend/app/services/material_infer.py
from PIL import Image

_model = None

def _load_model():
    global _model
    if _model is None:
        # TODO: 소재 추정 모델 로드
        _model = "loaded"
    return _model

def predict_materials(img: Image.Image):
    _load_model()
    # TODO: 전처리+추론+후처리
    # 예시 반환 형식
    return [
        {"name": "polyester", "confidence": 0.73},
        {"name": "cotton", "confidence": 0.24},
        {"name": "nylon", "confidence": 0.03},
    ]
