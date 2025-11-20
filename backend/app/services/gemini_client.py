import json
import logging
import os
from typing import Any, Dict, Iterable, List, Optional

import httpx

logger = logging.getLogger(__name__)

GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")
PRIMARY_MODEL = os.getenv("GEMINI_MODEL", "gemini-1.5-flash")
FALLBACK_MODEL = os.getenv("GEMINI_FALLBACK_MODEL")
REQUEST_TIMEOUT = float(os.getenv("GEMINI_TIMEOUT_SEC", "15"))
MAX_OUTPUT_TOKENS = int(os.getenv("GEMINI_MAX_OUTPUT_TOKENS", "512"))


def _build_prompt(detections: Iterable[Dict[str, Any]]) -> str:
    lines = []
    for idx, det in enumerate(detections, start=1):
        class_name = det.get("class_name") or det.get("code") or "unknown"
        description = (det.get("description") or "").strip()
        confidence = det.get("confidence")
        confidence_txt = ""
        if isinstance(confidence, (int, float)):
            confidence_txt = f" (신뢰도 {round(float(confidence) * 100, 1)}%)"
        line = f"{idx}. {class_name}{confidence_txt}"
        if description:
            line += f": {description}"
        lines.append(line)

    label_block = "\n".join(lines)
    prompt = (
        "당신은 한국어를 사용하는 전문 세탁 컨설턴트입니다.\n"
        "다음 케어라벨 인식 결과를 참고해 세탁 준비부터 건조/다림질/주의사항 순으로 단계별 가이드를 작성해 주세요.\n"
        "각 단계는 간결한 제목과 1~2문장의 설명으로 구성합니다.\n"
        "한국 소비자에게 친숙한 톤(존대, 간결한 지시문)을 사용하고, 반드시 한국어로 답하세요.\n\n"
        f"인식된 기호 목록:\n{label_block}\n\n"
        "출력은 JSON 한 덩어리로만 제공해야 하며, 아래 스키마를 정확히 준수하세요.\n"
        "{\n"
        '  "headline": "전체 의류 관리 방향 한 문장",\n'
        '  "alert": "가장 중요한 주의 문장 (없으면 빈 문자열)",\n'
        '  "steps": [\n'
        '    {"title": "준비물", "description": "· bullet1\\n· bullet2"},\n'
        '    {"title": "세탁", "description": "문장 형태 설명"},\n'
        "    ... 최소 3개, 최대 5개 ...\n"
        "  ],\n"
        '  "tips": "추가 팁 또는 마무리 문장 (없으면 빈 문자열)"\n'
        "}\n"
        "규칙:\n"
        "- steps 배열은 준비물/세탁/건조/다림질/주의사항 순으로 작성하되, 적합하지 않은 단계는 생략합니다.\n"
        "- description에는 줄바꿈을 허용하며, 불릿이 필요하면 '· '로 시작하세요.\n"
        "- JSON 외의 설명, 마크다운, 코드펜스는 절대 포함하지 마세요.\n"
        "- 숫자 인덱스나 불릿은 프론트엔드에서 렌더링하므로 title/description만 담습니다.\n"
    )
    return prompt


def _extract_json_text(raw_text: str) -> str:
    raw_text = raw_text.strip()
    if raw_text.startswith("```"):
        # remove code fences like ```json ... ```
        parts = raw_text.split("```")
        for chunk in parts:
            chunk = chunk.strip()
            if not chunk:
                continue
            lowered = chunk.lower()
            if lowered.startswith("json"):
                chunk = chunk.split("\n", 1)[1] if "\n" in chunk else ""
                chunk = chunk.strip()
                lowered = chunk.lower()
            if not chunk:
                continue
            if chunk.startswith("{"):
                return chunk
        return raw_text
    return raw_text


def _normalize_steps(steps: Any) -> List[Dict[str, str]]:
    normalized: List[Dict[str, str]] = []
    if not isinstance(steps, list):
        return normalized
    for idx, step in enumerate(steps, start=1):
        if not isinstance(step, dict):
            continue
        title = (step.get("title") or step.get("name") or "").strip()
        description = (
            step.get("description")
            or step.get("detail")
            or step.get("body")
            or ""
        ).strip()
        if not title and not description:
            continue
        normalized.append(
            {
                "title": title or f"단계 {idx}",
                "description": description,
            }
        )
    return normalized


def _parse_summary(raw_text: str) -> Dict[str, Any]:
    cleaned = _extract_json_text(raw_text)
    fallback = {
        "headline": cleaned.strip(),
        "alert": "",
        "steps": [],
        "tips": "",
        "raw_text": raw_text,
    }
    try:
        data = json.loads(cleaned)
    except json.JSONDecodeError:
        return fallback

    summary = {
        "headline": (data.get("headline") or "").strip(),
        "alert": (data.get("alert") or "").strip(),
        "steps": _normalize_steps(data.get("steps")),
        "tips": (data.get("tips") or "").strip(),
        "raw_text": raw_text,
    }
    if not summary["headline"]:
        summary["headline"] = fallback["headline"]
    return summary


async def _request_gemini(prompt: str, model_name: str) -> str:
    if not GEMINI_API_KEY:
        raise RuntimeError("GEMINI_API_KEY가 설정되어 있지 않습니다.")

    url = (
        f"https://generativelanguage.googleapis.com/v1beta/models/"
        f"{model_name}:generateContent?key={GEMINI_API_KEY}"
    )
    payload = {
        "contents": [{"role": "user", "parts": [{"text": prompt}]}],
        "generationConfig": {
            "temperature": 0.7,
            "top_p": 0.95,
            "max_output_tokens": MAX_OUTPUT_TOKENS,
        },
    }

    async with httpx.AsyncClient(timeout=REQUEST_TIMEOUT) as client:
        response = await client.post(url, json=payload)
        try:
            response.raise_for_status()
        except httpx.HTTPStatusError as exc:
            raise RuntimeError(f"Gemini 응답 오류: {exc.response.text}") from exc

    data = response.json()
    try:
        return data["candidates"][0]["content"]["parts"][0]["text"].strip()
    except (KeyError, IndexError, TypeError) as exc:
        raise RuntimeError(f"Gemini 응답 파싱 실패: {json.dumps(data, ensure_ascii=False)}") from exc


async def summarize_care_labels(detections: List[Dict[str, Any]]) -> Dict[str, Any]:
    if not detections:
        raise ValueError("detections 리스트가 비어 있습니다.")

    prompt = _build_prompt(detections)

    last_error: Optional[Exception] = None
    for model_name in filter(None, [PRIMARY_MODEL, FALLBACK_MODEL]):
        try:
            raw_text = await _request_gemini(prompt, model_name)
            return _parse_summary(raw_text)
        except Exception as exc:  # noqa: BLE001
            logger.warning("Gemini 모델 %s 요청 실패: %s", model_name, exc)
            last_error = exc

    if last_error:
        raise RuntimeError(f"Gemini 요약 생성 실패: {last_error}") from last_error
    raise RuntimeError("사용할 Gemini 모델이 설정되어 있지 않습니다.")
