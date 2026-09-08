# app/services/material_infer.py
from __future__ import annotations
import io, json, os, hashlib
from pathlib import Path
from typing import List, Dict, Any
import numpy as np
import torch
from torch import nn
from torchvision.models import efficientnet_b0
from torchvision import transforms
from PIL import Image
from app.services.multitask_model import MultitaskEfficientNet

# backend 루트/앱 경로 계산
_BACKEND_ROOT = Path(__file__).resolve().parents[2]  # .../backend
_APP_DIR = _BACKEND_ROOT / "app"
_ARTIFACT_DIR = (_APP_DIR / "models").resolve()


def _resolve_artifact(env_value: str | None, default: Path) -> Path:
    """환경변수가 상대경로일 때 backend 루트를 기준으로 보정."""
    if not env_value:
        return default.resolve()

    candidate = Path(env_value)
    if candidate.is_absolute():
        return candidate

    parts = candidate.parts
    if parts and parts[0] == "backend":
        candidate = Path(*parts[1:]) if len(parts) > 1 else Path(".")

    return (_BACKEND_ROOT / candidate).resolve()


CKPT = _resolve_artifact(os.getenv("FABRIC_CKPT"), _ARTIFACT_DIR / "best_multitask.pt")
MULTITASK_CONFIG = _ARTIFACT_DIR / "multitask_config.json"
THR_JSON = _resolve_artifact(os.getenv("FABRIC_THR"), _ARTIFACT_DIR / "thresholds_per_class_v3.json")
VOCAB_JSON = _resolve_artifact(os.getenv("FABRIC_VOCAB"), _ARTIFACT_DIR / "vocab_multilabel.json")

tf_352 = transforms.Compose([
    transforms.Resize((352, 352)),
    transforms.ToTensor(),
    transforms.Normalize([0.485,0.456,0.406],[0.229,0.224,0.225]),
])

device = torch.device("cuda" if torch.cuda.is_available() else "cpu")

_model: nn.Module | None = None
_vocab: List[str] = []
_thr: np.ndarray | float | None = None
_categories: List[Dict[str, str]] = []

def _build(num_classes: int) -> nn.Module:
    m = efficientnet_b0(weights=None)
    m.classifier[1] = nn.Linear(m.classifier[1].in_features, num_classes)
    return m

def _load_thresholds(thr_path: Path, vocab: List[str]) -> np.ndarray | float:
    if thr_path.exists():
        blob = json.loads(thr_path.read_text(encoding="utf-8"))
        if "thresholds" in blob:
            arr = np.array(blob["thresholds"], dtype="float32")
            assert len(arr) == len(vocab)
            return arr
        return np.array([float(blob.get(n, 0.5)) for n in vocab], dtype="float32")
    return 0.5

def _load_vocab(ckpt_blob: Dict[str, Any]) -> List[str]:
    vocab = ckpt_blob.get("vocab")
    if vocab:
        return vocab
    if VOCAB_JSON.exists():
        data = json.loads(VOCAB_JSON.read_text(encoding="utf-8"))
        if isinstance(data, dict):
            data = data.get("materials") or data.get("vocab") or data.get("labels")
        if not isinstance(data, list):
            raise RuntimeError(f"Unsupported vocab format in {VOCAB_JSON}")
        return [str(item) for item in data]
    raise RuntimeError(
        "Checkpoint에 vocab가 없고 FABRIC_VOCAB 경로도 찾지 못했습니다. "
        "FABRIC_VOCAB 환경변수나 vocab_multilabel.json을 설정해주세요."
    )

def warmup():
    """앱 시작 시 1회: 모델/임계값 로드 + 워밍업."""
    global _model, _vocab, _thr, _categories
    torch.set_num_threads(1)
    ckpt = torch.load(CKPT, map_location="cpu", weights_only=True)
    categories = []
    if "head_cat.weight" in ckpt["model"]:
        config = json.loads(MULTITASK_CONFIG.read_text(encoding="utf-8"))
        if hashlib.sha256(CKPT.read_bytes()).hexdigest() != config["checkpoint_sha256"]:
            raise RuntimeError("멀티태스크 모델과 라벨 설정의 체크섬이 다릅니다. 모델에 맞는 설정을 확인해주세요.")
        vocab = config["materials"]
        categories = config["categories"]
        if len(vocab) != ckpt["model"]["head_mat.weight"].shape[0] or len(categories) != ckpt["model"]["head_cat.weight"].shape[0]:
            raise RuntimeError("모델 출력 수와 소재/카테고리 라벨 수가 다릅니다.")
        m = MultitaskEfficientNet(len(vocab), len(categories))
        # 새 모델의 평가 기준을 사용하며 이전 모델의 임계값 파일은 재사용하지 않는다.
        thr = float(config["material_threshold"])
    else:
        vocab = _load_vocab(ckpt)
        m = _build(len(vocab))
        thr = _load_thresholds(THR_JSON, vocab)
    m.load_state_dict(ckpt["model"], strict=True)
    m.to(device).eval()
    with torch.inference_mode():
        _ = m(torch.zeros(1,3,352,352, device=device))
    _model, _vocab, _thr = m, vocab, thr
    _categories = categories
    print(f"[fabric] model loaded: C={len(_vocab)}, device={device}, thr={'per-class' if not isinstance(thr,float) else thr}")

def predict_bytes(content: bytes) -> Dict[str, Any]:
    assert _model is not None and _vocab, "model not loaded"
    img = Image.open(io.BytesIO(content)).convert("RGB")
    x = tf_352(img).unsqueeze(0).to(device)
    with torch.inference_mode():
        output = _model(x)
        logits = output[0] if _categories else output
        probs = torch.sigmoid(logits)[0].detach().cpu().numpy()

    if isinstance(_thr, (float, int)):
        yhat = probs >= float(_thr); thr_info = {"type":"global","value": float(_thr)}
    else:
        t = np.asarray(_thr, dtype="float32")
        yhat = probs >= t;          thr_info = {"type":"per-class","value": None}

    topk = min(5, len(_vocab))
    idx = probs.argsort()[::-1][:topk]
    top5 = [{"name": _vocab[i], "prob": float(probs[i]), "passed": bool(yhat[i])} for i in idx]
    preds = [ _vocab[i] for i, flag in enumerate(yhat) if flag ]

    result = {"predicted": preds, "top5": top5, "thresholds": thr_info}
    if _categories:
        category_probs = torch.softmax(output[1], dim=1)[0].detach().cpu().numpy()
        category_indices = category_probs.argsort()[::-1][:3]
        candidates = [{**_categories[i], "prob": float(category_probs[i])} for i in category_indices]
        result["category"] = candidates[0]
        result["category_top3"] = candidates
    return result
