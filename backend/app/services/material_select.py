from __future__ import annotations

from dataclasses import dataclass
from typing import Any, Iterable


@dataclass(frozen=True)
class MaterialCandidate:
    label: str
    prob: float


# Higher = more delicate (stricter care)
SENSITIVITY_SCORE: dict[str, int] = {
    # very delicate
    "silk": 5,
    "wool": 5,
    "cashmere": 5,
    # cellulosic regenerated (shape/strength sensitive when wet)
    "rayon": 4,  # incl. viscose
    "tencel": 4,
    "modal": 4,
    # elastic/thermoplastic: heat-sensitive
    "linen": 3,
    "nylon": 3,
    "spandex": 3,
    # common naturals
    "cotton": 2,
    # robust synthetics
    "polyester": 1,
    "synthetic": 1,
    "acrylic": 1,
}


def _coerce_prob(value: Any) -> float:
    try:
        if value is None:
            return 0.0
        if isinstance(value, (int, float)):
            return float(max(0.0, min(1.0, value)))
        s = str(value).strip()
        if s.endswith("%"):
            return float(s[:-1]) / 100.0
        return float(s)
    except Exception:
        return 0.0


def normalize_candidates(raw: Any) -> list[MaterialCandidate]:
    """
    Accepts common shapes:
      - [{"name": "wool", "prob": 0.98}, ...]  (material_infer top5)
      - [{"label": "wool", "prob": 0.98}, ...]
      - {"wool": 0.98, "nylon": 0.88, ...}
      - [("wool", 0.98), ...]
    """
    if not raw:
        return []

    out: list[MaterialCandidate] = []

    if isinstance(raw, dict):
        for k, v in raw.items():
            label = str(k or "").strip().lower()
            if not label:
                continue
            out.append(MaterialCandidate(label=label, prob=_coerce_prob(v)))
        return out

    if isinstance(raw, (list, tuple)):
        items: Iterable[Any] = raw
    else:
        return out

    for item in items:
        if isinstance(item, dict):
            label = (
                item.get("label")
                or item.get("name")
                or item.get("material")
                or ""
            )
            prob = item.get("prob", item.get("confidence", item.get("score", 0)))
            label = str(label or "").strip().lower()
            if not label:
                continue
            out.append(MaterialCandidate(label=label, prob=_coerce_prob(prob)))
        elif isinstance(item, (list, tuple)) and len(item) >= 1:
            label = str(item[0] or "").strip().lower()
            prob = item[1] if len(item) > 1 else 0
            if not label:
                continue
            out.append(MaterialCandidate(label=label, prob=_coerce_prob(prob)))
        else:
            label = str(item or "").strip().lower()
            if label:
                out.append(MaterialCandidate(label=label, prob=0.0))

    return out


def choose_sensitive_material(
    candidates_raw: Any,
    *,
    prob_threshold: float = 0.25,
) -> str:
    """
    Picks a single label to represent the item.

    Rule:
      1) Consider candidates with prob >= threshold.
      2) Choose the one with the highest sensitivity score.
         Ties are broken by higher probability.
      3) If none meet the threshold, fall back to the highest-probability label.
    """
    candidates = normalize_candidates(candidates_raw)
    if not candidates:
        return ""

    candidates_sorted = sorted(candidates, key=lambda c: c.prob, reverse=True)
    top_prob = candidates_sorted[0]

    eligible = [c for c in candidates_sorted if c.prob >= prob_threshold]
    if not eligible:
        return top_prob.label

    eligible_sorted = sorted(
        eligible,
        key=lambda c: (SENSITIVITY_SCORE.get(c.label, 0), c.prob),
        reverse=True,
    )
    return eligible_sorted[0].label

