#!/usr/bin/env bash
set -Eeuo pipefail
ps -ef | grep -E "uvicorn app.main:app" | grep -v grep || echo "uvicorn 없음"
if command -v lsof >/dev/null 2>&1; then
  lsof -i :${PORT:-8000} || true
fi
