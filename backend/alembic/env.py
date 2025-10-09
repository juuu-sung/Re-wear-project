# backend/alembic/env.py
from __future__ import annotations
import os
import sys
from logging.config import fileConfig

from sqlalchemy import engine_from_config, pool
from alembic import context

from app.db import Base
import app.models

# --- 로깅 설정 ---
config = context.config
if config.config_file_name is not None:
    fileConfig(config.config_file_name)

# --- 프로젝트 경로 추가 (alembic 폴더 기준 상위) ---
BASE_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
sys.path.append(BASE_DIR)

# --- .env 로드 (선택) ---
from dotenv import load_dotenv
load_dotenv(os.path.join(BASE_DIR, ".env"))

# --- SQLAlchemy Base/metadata import ---
from app.db import Base  # declarative_base()
import app.models
target_metadata = Base.metadata

# --- URL 결정: 환경변수 우선, 없으면 alembic.ini ---
DB_URL = os.getenv("DATABASE_URL")
if DB_URL:
    config.set_main_option("sqlalchemy.url", DB_URL)

# 마이그레이션 시 컬럼 타입/서브옵션 비교
def run_migrations_offline():
    url = config.get_main_option("sqlalchemy.url")
    context.configure(
        url=url,
        target_metadata=target_metadata,
        literal_binds=True,
        compare_type=True,
        compare_server_default=True,
    )
    with context.begin_transaction():
        context.run_migrations()

def run_migrations_online():
    connectable = engine_from_config(
        config.get_section(config.config_ini_section),
        prefix="sqlalchemy.",
        poolclass=pool.NullPool,
    )
    with connectable.connect() as connection:
        context.configure(
            connection=connection,
            target_metadata=target_metadata,
            compare_type=True,
            compare_server_default=True,
        )
        with context.begin_transaction():
            context.run_migrations()

if context.is_offline_mode():
    run_migrations_offline()
else:
    run_migrations_online()