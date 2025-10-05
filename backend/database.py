# database.py

import os
from dotenv import load_dotenv
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, declarative_base

# .env 파일에서 환경 변수를 불러옵니다.
load_dotenv()

DB_USER = os.getenv("DB_USER")
DB_PASSWORD = os.getenv("DB_PASSWORD")
DB_HOST = os.getenv("DB_HOST")
DB_PORT = os.getenv("DB_PORT")
DB_NAME = os.getenv("DB_NAME")

# 1. 데이터베이스 접속 주소 (PostgreSQL 형식으로 변경)
SQLALCHEMY_DATABASE_URL = f"postgresql://DB_USER:DB_PASSWORD@{DB_HOST}:{DB_PORT}/{DB_NAME}"

# 2. 데이터베이스 엔진 생성
# PostgreSQL을 사용할 때는 connect_args 옵션이 필요 없습니다.
engine = create_engine(SQLALCHEMY_DATABASE_URL)

# 3. 데이터베이스 세션 생성기 (변경 없음)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# 4. ORM 모델의 기본(Base) 클래스 생성 (변경 없음)
Base = declarative_base()