#!/usr/bin/env bash
set -Eeuo pipefail

ROOT="/opt/rewear/backend"
PORT="${PORT:-8000}"
HOST="${HOST:-0.0.0.0}"

cd "$ROOT"

# 가상환경 활성화
if [ ! -d "venv" ]; then
  echo "[ERR] venv가 없습니다: $ROOT/venv" >&2
  exit 1
fi
source venv/bin/activate
export PYTHONPATH="$ROOT"

# (선택) 최신 코드/의존성 업데이트
git fetch origin >/dev/null 2>&1 || true
git pull --ff-only origin main || true
pip install -r requirements.txt || true

# DB 마이그레이션
alembic upgrade head

# 포트 점유 확인
if command -v lsof >/dev/null 2>&1; then
  if lsof -i :"$PORT" -sTCP:LISTEN -t >/dev/null 2>&1; then
     echo "[ERR] 포트 $PORT 사용 중입니다. stop.sh로 중지하거나 다른 PORT로 실행하세요." >&2
     exit 2
  fi
fi

# 서버 실행
exec uvicorn app.main:app --host "$HOST" --port "$PORT" --reload
