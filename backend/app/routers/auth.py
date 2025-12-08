# backend/app/routers/auth.py

import httpx
from app.crud import user as crud_user
from app.schemas.user import RegisterIn, TokenOut, LoginIn # 스키마 (회원가입 양식, 토큰 양식)

from fastapi import Header, APIRouter, Depends, HTTPException, status, Form
from sqlalchemy.orm import Session
from sqlalchemy.exc import IntegrityError
from pydantic import BaseModel, EmailStr, constr
from passlib.context import CryptContext
from jose import jwt, JWTError
from datetime import datetime, timedelta
import os, time

from app.db import get_db
from app.models.user import User
import uuid # 👈 (랜덤 비번 생성용) 없으면 추가!
from datetime import timedelta
from google.oauth2 import id_token as google_id_token
from google.auth.transport import requests as google_requests

os.environ["PASSLIB_DISABLE_OS_CRYPTO"] = "1"

# ==========================================================
# Router & Config
# ==========================================================
router = APIRouter(prefix="/auth", tags=["auth"])

pwd_context = CryptContext(
    schemes=["pbkdf2_sha256", "bcrypt"],
    deprecated="auto",
    pbkdf2_sha256__default_rounds=390000,
)

SECRET_KEY = os.getenv("SECRET_KEY", "dev_secret")
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 60 * 3  # 3시간


def verify_password(plain_password, hashed_password):
    """
    입력받은 평문 비밀번호(plain_password)와 
    DB에 저장된 해시 비밀번호(hashed_password)가 일치하는지 확인
    """
    return pwd_context.verify(plain_password, hashed_password)

# ==========================================================
# Helper Functions
# ==========================================================
def normalize_email(email: str) -> str:
    return email.strip().lower()

def now_ts() -> int:
    return int(time.time())

def create_access_token(sub: str) -> str:
    """JWT 토큰 생성"""
    iat = now_ts()
    exp = iat + ACCESS_TOKEN_EXPIRE_MINUTES * 60
    payload = {"sub": sub, "iat": iat, "exp": exp}
    return jwt.encode(payload, SECRET_KEY, algorithm=ALGORITHM)

def get_user_by_email(db: Session, email: str):
    return db.query(User).filter(User.email == email).first()

# ✅ password 컬럼명 유연하게 대응
def get_user_password_hash(user: User) -> str | None:
    for attr in ("password_hash", "hashed_password", "password"):
        if hasattr(user, attr):
            return getattr(user, attr)
    return None

# ==========================================================
# 인증 관련
# ==========================================================
def get_current_user(
    db: Session = Depends(get_db),
    authorization: str | None = Header(default=None),
) -> User:
    """JWT 토큰 검증 및 유저 반환"""
    if not authorization or not authorization.lower().startswith("bearer "):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="인증 토큰이 없습니다.")

    token = authorization.split(" ", 1)[1]
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        sub = payload.get("sub")
        if not sub:
            raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="잘못된 토큰 형식")
        user = db.query(User).get(int(sub))
        if not user:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="사용자를 찾을 수 없습니다.")
        return user
    except JWTError:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="토큰 검증 실패")

# ==========================================================
# Routes
# ==========================================================
@router.post("/register")
def register(payload: RegisterIn, db: Session = Depends(get_db)):
    """회원가입"""
    print("회원가입 시도:", payload.dict())
    try:
        email_norm = normalize_email(payload.email)
        if get_user_by_email(db, email_norm):
            raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="이미 존재하는 이메일입니다.")

        # ✅ 비밀번호 해싱
        hashed_pw = pwd_context.hash(str(payload.password))

        # 모델 컬럼 자동 탐색
        kwargs = dict(name=payload.name, email=email_norm)
        if hasattr(User, "password_hash"):
            kwargs["password_hash"] = hashed_pw
        elif hasattr(User, "hashed_password"):
            kwargs["hashed_password"] = hashed_pw
        else:
            kwargs["password"] = hashed_pw

        user = User(**kwargs)
        db.add(user)
        db.commit()
        db.refresh(user)

        print(f"✅ 회원가입 완료: {user.id} / {user.email}")
        return {
            "msg": "회원가입이 완료되었습니다.",
            "user": {"id": user.id, "name": user.name, "email": user.email},
        }

    except IntegrityError:
        db.rollback()
        raise HTTPException(status_code=409, detail="이미 존재하는 이메일입니다.")
    except Exception as e:
        db.rollback()
        print("🔥 예외 발생:", e)
        raise HTTPException(status_code=500, detail=str(e))

# ----------------------------------------------------------
@router.post("/login")
def login_json(payload: LoginIn, db: Session = Depends(get_db)):
    """JSON 기반 로그인"""
    print("🔐 로그인 시도:", payload.dict())
    email_norm = normalize_email(payload.email)

    user = get_user_by_email(db, email_norm)
    if not user:
        raise HTTPException(status_code=404, detail="사용자가 존재하지 않습니다.")

    stored_hash = get_user_password_hash(user)
    if not stored_hash:
        raise HTTPException(status_code=500, detail="서버 비밀번호 필드 미설정")

    try:
        ok = pwd_context.verify(payload.password, stored_hash)
    except Exception as e:
        print("❌ verify 에러:", e)
        ok = False

    if not ok:
        raise HTTPException(status_code=401, detail="비밀번호가 일치하지 않습니다.")

    token = create_access_token(sub=str(user.id))
    print("✅ 로그인 성공:", user.email)

    # ✅ user_id, username 추가
    return {
        "access_token": token,
        "token_type": "bearer",
        "user_id": user.id,
        "username": user.name or "",
        "email": user.email
    }

# ----------------------------------------------------------
@router.post("/token")
def login_form(
    username: str = Form(...),
    password: str = Form(...),
    db: Session = Depends(get_db),
):
    """form-urlencoded 기반 로그인 (선택적 사용)"""
    email_norm = normalize_email(username)

    user = get_user_by_email(db, email_norm)
    if not user:
        raise HTTPException(status_code=404, detail="사용자가 존재하지 않습니다.")

    stored_hash = get_user_password_hash(user)
    if not stored_hash:
        raise HTTPException(status_code=500, detail="서버 비밀번호 필드 미설정")

    try:
        ok = pwd_context.verify(password, stored_hash)
    except Exception as e:
        print("❌ verify 에러:", e)
        ok = False

    if not ok:
        raise HTTPException(status_code=401, detail="비밀번호가 일치하지 않습니다.")

    token = create_access_token(sub=str(user.id))
    print("✅ form 로그인 성공:", user.email)

    # ✅ 동일하게 user_id, username 포함
    return {
        "access_token": token,
        "token_type": "bearer",
        "user_id": user.id,
        "username": user.name or "",
        "email": user.email
    }

# ----------------------------------------------------------
@router.get("/me")
def read_me(current: User = Depends(get_current_user)):
    """내 정보 확인"""
    return {
        "id": current.id,
        "name": current.name or "",
        "email": current.email,
        "profile_image": current.profile_image,
    }

# --- 카카오 관련 추가 내용

class KakaoToken(BaseModel):
    access_token: str

@router.post("/kakao", response_model=TokenOut)
async def kakao_login(token: KakaoToken, db: Session = Depends(get_db)):
    KAKAO_USER_INFO_API = "https://kapi.kakao.com/v2/user/me"
    headers = {"Authorization": f"Bearer {token.access_token}"}

    async with httpx.AsyncClient() as client:
        res = await client.get(KAKAO_USER_INFO_API, headers=headers)

    if res.status_code != 200:
        raise HTTPException(status_code=400, detail="카카오 토큰이 유효하지 않습니다.")
    
    kakao_user_info = res.json()
    kakao_id = kakao_user_info.get("id") # ✅ 이메일 대신 고유 ID를 가져옵니다.
    nickname = kakao_user_info.get("properties", {}).get("nickname", "Kakao User")

    if not kakao_id:
        raise HTTPException(status_code=400, detail="카카오 ID를 가져올 수 없습니다.")

    # ✅ 이메일 대신 kakao_id로 사용자를 찾습니다.
    user = crud_user.get_by_kakao_id(db, kakao_id=kakao_id)

    if not user:
        # 사용자가 없으면, kakao_id와 임시 이메일로 새로 가입시킵니다.
        new_user_data = RegisterIn(
            email=f"kakao_{kakao_id}@rewear.com", # 👈 중복되지 않는 임시 이메일 생성
            name=nickname,
            password=f"kakao_pw_{kakao_id}"
        )
        user = crud_user.create_user(db, user_in=new_user_data, kakao_id=kakao_id) # ✅ kakao_id 전달

    # 우리 앱 전용 JWT 토큰 생성 및 반환
    access_token = create_access_token(sub=str(user.id))
    return TokenOut(access_token=access_token, user_id=user.id)

# 🔥 [추가] 구글 로그인 요청 데이터 모델
class GoogleLoginRequest(BaseModel):
    id_token: str

# 🔥 [추가] 구글 로그인 API
@router.post("/google", response_model=TokenOut)
def login_google(
    req: GoogleLoginRequest, 
    db: Session = Depends(get_db)
):
    # 구글 클라이언트 ID (프론트에 넣은 것과 똑같은 거!)
    GOOGLE_CLIENT_ID = "472072812397-f51bchihsifn54boars84kf82uv2eeia.apps.googleusercontent.com"

    try:
        # 1. 토큰 검증 (구글 라이브러리가 알아서 해줌)
        id_info = google_id_token.verify_oauth2_token(
            req.id_token, 
            google_requests.Request(), 
            GOOGLE_CLIENT_ID
        )

        # 2. 정보 추출
        email = id_info.get("email")
        name = id_info.get("name")
        # google_user_id = id_info.get("sub") # 구글 고유 ID

        if not email:
            raise HTTPException(status_code=400, detail="이메일 정보가 없습니다.")

        # 3. DB 확인 및 가입/로그인 처리 (카카오랑 똑같은 로직)
        user = crud_user.get_by_email(db, email=email)
        
        if not user:
            # 신규 가입
            user_in = RegisterIn(
                email=email,
                password=uuid.uuid4().hex, # 랜덤 비번
                name=name,
                phone_number=None # 구글은 전화번호 잘 안 줌
            )
            print("🛑 [디버그] user_in의 정체:", user_in)
            print("🛑 [디버그] 가지고 있는 필드들:", user_in.model_dump())
            user = crud_user.create_user(db, user_in)
        
        # 4. 우리 앱 토큰 발급
        access_token_expires = timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
        access_token = create_access_token(sub=str(user.id))
        
        return {
            "access_token": access_token, 
            "token_type": "bearer",
            "user_id": user.id,
            "username": user.name
        }

    except ValueError:
        # 토큰이 위조되었거나 만료됨
        raise HTTPException(status_code=400, detail="유효하지 않은 구글 토큰입니다.")