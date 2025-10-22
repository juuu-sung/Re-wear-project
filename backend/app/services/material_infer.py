# app/services/material_infer.py
from __future__ import annotations
import io, json, os
from pathlib import Path
from typing import List, Dict, Any
import numpy as np
import torch
from torch import nn
from torchvision.models import efficientnet_b0
from torchvision import transforms
from PIL import Image

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


CKPT = _resolve_artifact(os.getenv("FABRIC_CKPT"), _ARTIFACT_DIR / "best_ml.pt")
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
    global _model, _vocab, _thr
    torch.set_num_threads(1)
    ckpt = torch.load(CKPT, map_location="cpu")
    vocab = _load_vocab(ckpt)
    m = _build(len(vocab))
    m.load_state_dict(ckpt["model"], strict=True)
    m.to(device).eval()
    thr = _load_thresholds(THR_JSON, vocab)
    with torch.inference_mode():
        _ = m(torch.zeros(1,3,352,352, device=device))
    _model, _vocab, _thr = m, vocab, thr
    print(f"[fabric] model loaded: C={len(_vocab)}, device={device}, thr={'per-class' if not isinstance(thr,float) else thr}")

def predict_bytes(content: bytes) -> Dict[str, Any]:
    assert _model is not None and _vocab, "model not loaded"
    img = Image.open(io.BytesIO(content)).convert("RGB")
    x = tf_352(img).unsqueeze(0).to(device)
    with torch.inference_mode():
        logits = _model(x)
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

    return {"predicted": preds, "top5": top5, "thresholds": thr_info}
