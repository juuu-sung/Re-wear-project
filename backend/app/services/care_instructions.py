import os, json, time
from typing import List, Dict, Optional, Any
from collections.abc import Iterable
from google import genai
from google.genai import types
from cachetools import TTLCache
from tenacity import retry, stop_after_attempt, wait_exponential, retry_if_exception_type

GEMINI_API_KEY = os.getenv("GEMINI_API_KEY", "")
GEMINI_MODEL   = os.getenv("GEMINI_MODEL", "gemini-2.5-flash")
GEMINI_TIMEOUT = int(os.getenv("GEMINI_TIMEOUT_SEC", "18"))
GEMINI_MAX_OUTPUT_TOKENS = int(os.getenv("GEMINI_MAX_OUTPUT_TOKENS", "1024"))
GEMINI_TEMPERATURE = float(os.getenv("GEMINI_TEMPERATURE", "0.6"))
GEMINI_FALLBACK_MODEL = os.getenv("GEMINI_FALLBACK_MODEL", "gemini-2.5-flash-lite")

if not GEMINI_API_KEY:
    raise RuntimeError("GEMINI_API_KEY is not set")

# New GenAI SDK client (reads GEMINI_API_KEY automatically)
client = genai.Client()

# 5분 캐시: 같은 입력이면 재사용
_cache = TTLCache(maxsize=512, ttl=300)

class GeminiError(Exception):
    pass


def _coerce_to_text(blob: Any) -> str:
    """
    Gemini SDK 객체(신형 google-genai의 pydantic 모델 포함)를 문자열로 변환한다.
    예전처럼 임의의 Iterable을 순회하지 않도록 하여 'parts\nrole\nmodel' 같은
    키 나열이 출력되는 문제를 방지한다.
    """
    if blob is None:
        return ""
    # 이미 문자열이면 그대로
    if isinstance(blob, str):
        return blob

    # 신형 SDK(pydantic BaseModel) → dict로 변환
    try:
        if hasattr(blob, "model_dump"):
            blob = blob.model_dump()  # type: ignore[attr-defined]
    except Exception:
        pass

    # 리스트/튜플만 순회 (임의 Iterable은 순회하지 않음)
    if isinstance(blob, (list, tuple)):
        pieces = [_coerce_to_text(part) for part in list(blob)]
        return "\n".join([p.strip() for p in pieces if p])

    # dict 처리
    if isinstance(blob, dict):
        # 흔한 케이스: {"text": "..."} 또는 {"parts": [{"text": "..."}], "role": "model"}
        if "text" in blob and isinstance(blob["text"], str):
            return blob["text"]
        if "parts" in blob and isinstance(blob["parts"], (list, tuple)):
            return _coerce_to_text(blob["parts"])
        # 의미 있는 텍스트 필드가 없으면 빈 문자열 반환 (임의의 dict를 그대로 내보내지 않음)
        return ""

    # 객체 속성에서 텍스트 계열 추출
    for attr in ("text", "output_text", "content", "parts"):
        try:
            val = getattr(blob, attr, None)
            if val:
                return _coerce_to_text(val)
        except Exception:
            continue

    # 마지막 수단: 문자열화
    return str(blob)


def _safe_getattr(obj: Any, name: str) -> Any:
    try:
        return getattr(obj, name)
    except Exception:
        return None


def _extract_candidate_text(candidate: Any) -> str:
    if candidate is None:
        return ""
    raw_content = (
        _safe_getattr(candidate, "content")
        or (candidate.get("content") if isinstance(candidate, dict) else None)
    )
    contents: List[Any] = []
    if raw_content is not None:
        if isinstance(raw_content, (list, tuple)):
            contents.extend(raw_content)
        else:
            contents.append(raw_content)

    pieces: List[str] = []
    for content in contents:
        parts = (
            _safe_getattr(content, "parts")
            or (content.get("parts") if isinstance(content, dict) else None)
        )
        if not parts:
            continue
        for part in parts:
            txt = (
                _safe_getattr(part, "text")
                or (part.get("text") if isinstance(part, dict) else None)
            )
            if txt:
                pieces.append(str(txt).strip())

    if pieces:
        return "\n".join(pieces).strip()
    if contents:
        return _coerce_to_text(contents).strip()
    return _coerce_to_text(candidate).strip()


import re
_LBL_PROB_RE = re.compile(r"^\s*([A-Za-z_]+)\s*(?:[:\(]\s*([0-9]+(?:\.[0-9]+)?)\s*%?\s*\)?)?\s*$")

def _parse_label_prob_from_text(s: str) -> tuple[str, float | None]:
    """
    Accepts text like:
      - "wool"
      - "wool:0.8"
      - "wool (80%)"
      - "wool 80"
    Returns (label, prob|None). prob is 0~1 float if present.
    """
    s = (s or "").strip()
    if not s:
        return ("", None)
    m = _LBL_PROB_RE.match(s)
    if not m:
        # fallback: try "label prob" split
        parts = s.split()
        if len(parts) == 2:
            lbl, pr = parts[0], parts[1]
            return (lbl.strip(), _coerce_prob(pr))
        return (s, None)
    lbl = m.group(1).strip()
    pr  = m.group(2)
    return (lbl, (_coerce_prob(pr) if pr is not None else None))

def _normalize_candidates(cands: Any) -> List[Dict[str, Any]]:
    """
    후보가 문자열, dict, list 섞여 들어와도 일관화: [{label, prob}]
    """
    if not cands:
        return []
    if isinstance(cands, str):
        parts = [p.strip() for p in cands.split(",")]
        out: List[Dict[str, Any]] = []
        for p in parts:
            if ":" in p:
                k, v = p.split(":", 1)
                out.append({"label": k.strip(), "prob": _coerce_prob(v.strip())})
            else:
                lbl, pr = _parse_label_prob_from_text(p)
                out.append({"label": lbl, "prob": ( _coerce_prob(pr) if pr is not None else None )})
        return out
    if isinstance(cands, dict):
        return [{"label": k, "prob": _coerce_prob(v)} for k, v in cands.items()]
    if isinstance(cands, list):
        norm: List[Dict[str, Any]] = []
        for it in cands:
            if isinstance(it, dict) and "label" in it:
                norm.append({"label": str(it.get("label")).strip(), "prob": _coerce_prob(it.get("prob"))})
            elif isinstance(it, (list, tuple)) and len(it) >= 1:
                lbl = it[0]
                pr  = it[1] if len(it) > 1 else None
                norm.append({"label": str(lbl).strip(), "prob": _coerce_prob(pr)})
            else:
                # plain text like "wool (80%)"
                lbl, pr = _parse_label_prob_from_text(str(it))
                norm.append({"label": lbl, "prob": ( _coerce_prob(pr) if pr is not None else None )})
        return norm
    return [{"label": str(cands).strip(), "prob": None}]

# --- Hybrid selection: sensitivity-first with probability threshold ---
# Sensitivity score: higher = more delicate (stricter care)
_SENSITIVITY_SCORE = {
    # very delicate
    "silk": 5,
    "wool": 5,
    # cellulosic regenerated (shape/strength sensitive when wet)
    "rayon": 4,   # incl. viscose
    # elastic/thermoplastic: heat-sensitive
    "nylon": 3,
    "spandex": 3,
    # common naturals
    "cotton": 2,
    "linen": 2,   # kept for completeness (may not appear in v7)
    # robust synthetics
    "polyester": 1,
    "synthetic": 1,
    "acrylic": 1,
}

def _coerce_prob(p: Any) -> float:
    """
    Accepts 0~1 float, percentage string '63%', or None.
    Returns a clamped float in [0,1].
    """
    try:
        if p is None:
            return 0.0
        if isinstance(p, (int, float)):
            return float(max(0.0, min(1.0, p)))
        s = str(p).strip()
        if s.endswith("%"):
            return float(s[:-1]) / 100.0
        return float(s)
    except Exception:
        return 0.0

def choose_material_hybrid(
    candidates: List[Dict[str, Any]],
    prob_threshold: float = 0.25,
    topk: int = 3
) -> tuple[str, str]:
    """
    Hybrid rule:
      1) Among candidates with prob >= threshold, pick the one with the HIGHEST sensitivity score.
         Ties are broken by higher probability.
      2) If none meet the threshold, fall back to the highest-probability label.
    Returns:
      (selected_label, rationale_text)
    """
    # Normalize (label, prob)
    norm = []
    for c in candidates:
        lbl = str(c.get("label", "")).strip().lower()
        pr  = _coerce_prob(c.get("prob", 0))
        if not lbl:
            continue
        norm.append({"label": lbl, "prob": pr})

    if not norm:
        return ("", "후보가 없어 기준 소재를 결정하지 못했습니다.")

    # Sort by prob desc to get a simple fallback and reporting
    norm.sort(key=lambda x: x["prob"], reverse=True)
    top_prob_label = norm[0]["label"]

    # Filter by threshold and score by sensitivity
    eligible = []
    for c in norm:
        if c["prob"] >= prob_threshold:
            score = _SENSITIVITY_SCORE.get(c["label"], 0)
            eligible.append((score, c["prob"], c["label"]))

    if eligible:
        eligible.sort(key=lambda t: (t[0], t[1]), reverse=True)
        sel_score, sel_prob, sel_label = eligible[0]
        # Human-readable rationale
        head = ", ".join(f"{c['label']}({c['prob']:.2f})" for c in norm[:max(1, topk)])
        reason = (
            f"민감도 우선 규칙 적용: 확률≥{prob_threshold:.2f} 후보 중 "
            f"민감도가 가장 높은 '{sel_label}'을 선택했습니다 "
            f"(민감도={sel_score}, 확률={sel_prob:.2f}). "
            f"상위 후보: {head}"
        )
        return (sel_label, reason)

    # Fallback to highest-probability if no one passed threshold
    head = ", ".join(f"{c['label']}({c['prob']:.2f})" for c in norm[:max(1, topk)])
    reason = (
        f"확률≥{prob_threshold:.2f} 기준을 만족하는 민감 후보가 없어 "
        f"최대 확률 '{top_prob_label}'을 기준 소재로 사용합니다. "
        f"상위 후보: {head}"
    )
    return (top_prob_label, reason)

def _build_prompt(
    material: Optional[str],
    candidates: List[Dict[str, Any]],
    washing: Any,
    locale: str = "ko",
    rationale: Optional[str] = None
) -> str:
    """
    프롬프트 템플릿: 한국어 단계별(번호 매겨진) 세탁 가이드 출력 (자세한 설명 포함).
    - 단계별 세탁 과정을 구체적으로 안내 (예: 물 온도, 세탁 코스, 세제량, 시간 등)
    - 각 단계는 행동 중심으로 작성하고, 초보자도 이해할 수 있게 작성
    - 항목마다 구분해서 보기 편하게 작성
    - 마지막에 20자 내외 한줄요약 포함
    - 전체 분량은 10~15문장 이내로 제한
    """
    # JSON/원문은 보수적으로 컷
    short_washing = washing
    try:
        if isinstance(washing, (dict, list)):
            short_washing = json.dumps(washing, ensure_ascii=False)[:900]
        elif isinstance(washing, str) and len(washing) > 900:
            short_washing = washing[:900]
    except Exception:
        pass

    cand_str = ", ".join(
        f"{c.get('label')}({c.get('prob'):.2f})" if isinstance(c.get('prob'), (int, float))
        else f"{c.get('label')}"
        for c in candidates
    ) or "정보 없음"

    # 시스템 지시: 단계별 + 번호 매김 + 간결 + 안전 우선
    sys = (
        "당신은 의류 세탁 가이드 전문가입니다. "
        "한국어로 초보자도 따라 할 수 있도록 구체적이고 단계별로 설명하세요. "
        "각 단계에서 물 온도, 세제 종류, 세탁 시간, 헹굼 및 탈수 정도, 건조 환경, 다림질 온도 등을 명시하세요. "
        "항상 안전을 우선하여 표백제, 고온 다림질, 건조기 사용 시 주의사항을 반드시 포함하세요. "
        "혼방이나 불확실한 경우에는 보수적인 세탁법을 제시하고, 가정이나 이유를 덧붙이세요. "
        "불필요한 감정 표현은 피하고, 실용적인 세탁 절차 중심으로 서술하세요."
    )

    # 사용자 요청: 고정된 출력 양식(번호 매긴 단계)
    user = f"""
[소재 확정값] {material or "미지정"}
[소재 후보] {cand_str}
[세탁 가이드(원본)] {short_washing}

요청:
다음의 고정된 형식으로만 출력하세요. 각 항목은 줄바꿈으로 구분하고, 1~6번은 반드시 번호를 붙이세요.

1) 준비물: (필요한 세제, 섬유유연제, 세탁망, 물 온도 등)
2) 분류: (색상, 섬세도, 오염도별 구분)
3) 세탁: (세탁 코스, 세탁기/손세탁 여부, 시간, 세제량, 주의사항)
4) 헹굼 및 건조: (헹굼 횟수, 탈수 정도, 건조 방식, 환경 조건)
5) 다림질: (온도, 시간, 천 대는 방법, 주의사항)
6) 주의/예외: (표백, 수축, 이염, 형태 손상 관련 주의)
한줄요약: (20자 내외, 핵심만)

조건:
- 번호(1~6)는 그대로 유지하고, 각 항목은 문장 단위로 구체적으로 작성하세요.
- 각 단계는 약 1~3문장씩으로 총 10~15문장 내외가 되도록 하세요.
- 항목마다 구분해서 보기 편하게 하세요.
"""
    if rationale:
        user += f"\n[선정 근거] {rationale}\n"
    return sys + "\n\n" + user

def _key_for_cache(material: Optional[str], candidates: List[Dict[str, Any]], washing: Any, force_auto: bool = False) -> str:
    try:
        return json.dumps({
            "m": material,
            "c": candidates,
            "w": washing if isinstance(washing, (str, int, float)) else str(washing),
            "fa": bool(force_auto),
        }, sort_keys=True, ensure_ascii=False)
    except Exception:
        return f"{material}|{candidates}|{washing}|fa={bool(force_auto)}"

@retry(
    reraise=True,
    stop=stop_after_attempt(2),                        # 최대 2회
    wait=wait_exponential(multiplier=0.8, min=0.8, max=3),
    retry=retry_if_exception_type((TimeoutError, GeminiError))
)
def _call_gemini(prompt: str) -> str:
    def _gen(model_name: str):
        return client.models.generate_content(
            model=model_name,
            contents=_coerce_to_text(prompt),
            config=types.GenerateContentConfig(
                temperature=GEMINI_TEMPERATURE,
                max_output_tokens=GEMINI_MAX_OUTPUT_TOKENS,
                response_mime_type="text/plain",
                candidate_count=1,
                top_k=40,
            ),
        )
    try:
        resp = _gen(GEMINI_MODEL)
    except Exception as e:
        # 1차 호출 자체가 실패하면 바로 폴백 모델로 시도
        try:
            resp = _gen(GEMINI_FALLBACK_MODEL)
        except Exception:
            raise GeminiError(str(e))

    # 안전 필터/차단 사유 노출
    pf = getattr(resp, "prompt_feedback", None)
    try:
        block_reason = getattr(pf, "block_reason", None) if pf else None
    except Exception:
        block_reason = None
    if block_reason:
        # 원인 로그
        try:
            print("[care_instructions] prompt_feedback=", resp.prompt_feedback.model_dump_json())
        except Exception:
            print("[care_instructions] prompt_feedback=", str(pf))
        raise GeminiError(f"Gemini 응답이 안전 필터에 의해 차단되었습니다. block_reason={block_reason}")

    # --- 응답 텍스트 파싱 ---
    text = (getattr(resp, "text", None) or getattr(resp, "output_text", None) or "")
    text = (text or "").strip()

    # candidates에서 보조 추출
    if not text:
        cands = getattr(resp, "candidates", None)
        if cands:
            # 첫 후보의 parts에서 text 수집
            try:
                cand0 = cands[0]
                extracted = _extract_candidate_text(cand0).strip()
                if extracted:
                    text = extracted
            except Exception:
                pass

    # === 텍스트가 전혀 없을 때 즉시 폴백 모델로 재시도 ===
    if not text:
        try:
            resp_fb0 = _gen(GEMINI_FALLBACK_MODEL)
            text_fb0 = (getattr(resp_fb0, "text", None) or getattr(resp_fb0, "output_text", None) or "")
            text_fb0 = (text_fb0 or "").strip()
            if not text_fb0:
                cands_fb0 = getattr(resp_fb0, "candidates", None)
                if cands_fb0:
                    try:
                        extracted_fb0 = _extract_candidate_text(cands_fb0[0]).strip()
                        if extracted_fb0:
                            text_fb0 = extracted_fb0
                    except Exception:
                        pass
            if text_fb0:
                text = text_fb0
        except Exception:
            # 폴백도 실패하면 아래 로깅/에러로 진행
            pass

    # 폴백 트리거: 출력이 없거나 MAX_TOKENS, 또는 과도한 thoughts 토큰 사용
    if not text:
        pass  # handled below
    else:
        try:
            # finish_reason 확인
            fr = None
            try:
                c0 = getattr(resp, "candidates", None)
                if c0:
                    fr = getattr(c0[0], "finish_reason", None)
            except Exception:
                fr = None
            # thoughts 토큰 확인
            usage = getattr(resp, "usage_metadata", None)
            thoughts = getattr(usage, "thoughts_token_count", None) if usage else None
            trigger_retry = (fr == "MAX_TOKENS") or (isinstance(thoughts, int) and thoughts >= 512)
        except Exception:
            trigger_retry = False

        if trigger_retry:
            try:
                resp_fb = _gen(GEMINI_FALLBACK_MODEL)
                # 다시 파싱
                text_fb = (getattr(resp_fb, "text", None) or getattr(resp_fb, "output_text", None) or "")
                text_fb = (text_fb or "").strip()
                if not text_fb:
                    cands_fb = getattr(resp_fb, "candidates", None)
                    if cands_fb:
                        try:
                            extracted_fb = _extract_candidate_text(cands_fb[0]).strip()
                            if extracted_fb:
                                text_fb = extracted_fb
                        except Exception:
                            pass
                if text_fb:
                    text = text_fb
            except Exception:
                # 폴백도 실패하면 기존 text 유지
                pass

    if not text:
        # 디버그용 전체 응답 로그
        try:
            print("[care_instructions] raw response=", resp.model_dump_json()[:4000])
        except Exception:
            print("[care_instructions] raw response (str)=", str(resp)[:1000])
        # 임의 dict 문자열이 사용자에게 그대로 보이지 않도록 빈 응답으로 처리
        raise GeminiError("Gemini 응답에 텍스트가 없습니다.")
    return text

def explain(
    material: Optional[str],
    candidates_raw: Any,
    washing: Any,
    locale: str = "ko",
    force_auto: bool = False
) -> str:
    """
    외부에 노출되는 진입점.
    """
    candidates = _normalize_candidates(candidates_raw)
    rationale = None
    # Force re-selection when force_auto=True or material is empty/'auto'
    if force_auto or (not material) or (str(material).strip().lower() == "auto"):
        chosen_label, rationale = choose_material_hybrid(candidates, prob_threshold=0.25, topk=3)
        chosen_label = chosen_label or None
    else:
        chosen_label = material
    cache_key = _key_for_cache(material, candidates, washing, force_auto=force_auto)
    if cache_key in _cache:
        return _cache[cache_key]

    prompt = _build_prompt(chosen_label or material, candidates, washing, locale=locale, rationale=rationale)
    t0 = time.time()
    text = _call_gemini(prompt)
    dt = time.time() - t0

    # 길이 과도하면 컷(UX 보호)
    if len(text) > 1500:
        text = text[:1500].rstrip() + "…"

    # 간단한 로깅 포맷 (개인정보/원문 과다 로그 주의)
    print(f"[care_instructions] ok len={len(text)} time={dt:.2f}s")

    _cache[cache_key] = text
    return text
