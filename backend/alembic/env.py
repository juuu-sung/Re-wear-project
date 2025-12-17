import os
import sys
from logging.config import fileConfig
from sqlalchemy import pool, create_engine
from alembic import context

#  1. backend 기준으로 app 경로 추가
BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
sys.path.append(BASE_DIR)

#  2. app 내부 모듈 import
from app.db import Base  # Base 정의
from app.models import *  # 모든 모델 (article 포함)
from app.core.config import settings  # DATABASE_URL 포함

#  3. Alembic 기본 설정
config = context.config
if config.config_file_name is not None:
    fileConfig(config.config_file_name)

#  4. DB URL 환경변수 덮어쓰기 (.env 사용 시)
if settings.DATABASE_URL:
    config.set_main_option("sqlalchemy.url", settings.DATABASE_URL)

#  5. Alembic이 참고할 metadata
target_metadata = Base.metadata


def run_migrations_offline():
    """Run migrations in 'offline' mode."""
    url = config.get_main_option("sqlalchemy.url")
    context.configure(
        url=url,
        target_metadata=target_metadata,
        literal_binds=True,
        dialect_opts={"paramstyle": "named"},
    )

    with context.begin_transaction():
        context.run_migrations()


def run_migrations_online():
    """Run migrations in 'online' mode (uses .env DATABASE_URL)."""
    connectable = create_engine(settings.DATABASE_URL, poolclass=pool.NullPool)

    with connectable.connect() as connection:
        context.configure(connection=connection, target_metadata=target_metadata)
        with context.begin_transaction():
            context.run_migrations()


if context.is_offline_mode():
    run_migrations_offline()
else:
    run_migrations_online()