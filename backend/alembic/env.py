from logging.config import fileConfig
from sqlalchemy import engine_from_config, pool
from alembic import context

# ✅ app 패키지 내부 경로 설정
import sys, os
sys.path.append(os.path.join(os.path.dirname(__file__), '..'))
from app.db import Base  # ✅ Base import
from app.models import *  # ✅ 모든 모델 import

# ✅ --- .env 파일 로드 기능 추가 ---
from dotenv import load_dotenv
load_dotenv()
# ✅ ---------------------------------

config = context.config

# ✅ --- DB URL을 .env 값으로 설정 ---
# alembic.ini의 sqlalchemy.url 값을 .env의 DATABASE_URL 값으로 덮어씁니다.
config.set_main_option('sqlalchemy.url', os.getenv('DATABASE_URL'))
# ✅ ---------------------------------

if config.config_file_name is not None:
    fileConfig(config.config_file_name)

# ✅ Alembic이 참고할 metadata 지정
target_metadata = Base.metadata

def run_migrations_offline():
    """Run migrations in 'offline' mode."""
    context.configure(
        url=config.get_main_option("sqlalchemy.url"),
        target_metadata=target_metadata,  # ✅ 여기 중요
        literal_binds=True,
        dialect_opts={"paramstyle": "named"},
    )
    with context.begin_transaction():
        context.run_migrations()

def run_migrations_online():
    """Run migrations in 'online' mode."""
    connectable = engine_from_config(
        config.get_section(config.config_ini_section),
        prefix="sqlalchemy.",
        poolclass=pool.NullPool,
    )

    with connectable.connect() as connection:
        context.configure(connection=connection, target_metadata=target_metadata)  # ✅ 중요
        with context.begin_transaction():
            context.run_migrations()

if context.is_offline_mode():
    run_migrations_offline()
else:
    run_migrations_online()
