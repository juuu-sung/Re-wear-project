#!/usr/bin/env bash
set -Eeuo pipefail
# uvicorn 프로세스 종료 (동일 유저 기준)
pkill -f "uvicorn app.main:app" || true
