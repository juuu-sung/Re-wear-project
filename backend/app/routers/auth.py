# backend/app/routers/auth.py
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

router = APIRouter(prefix="/auth", tags=["auth"])

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
SECRET_KEY = os.getenv("SECRET_KEY", "dev_secret")
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 60 * 3  # 3h

def normalize_email(email: str) -> str:
    return email.strip().lower()

def now_ts() -> int:
    return int(time.time())

def create_access_token(sub: str) -> str:
    iat = now_ts()
    exp = iat + ACCESS_TOKEN_EXPIRE_MINUTES * 60
    payload = {"sub": sub, "iat": iat, "exp": exp}   # ✅ 숫자 타임스탬프
    return jwt.encode(payload, SECRET_KEY, algorithm=ALGORITHM)

# 유연하게 컬럼명 처리: password_hash 우선, 없으면 password/hashed_password 순서로 탐색
def get_user_password_hash(user: User) -> str | None:
    for attr in ("password_hash", "hashed_password", "password"):
        if hasattr(user, attr):
            return getattr(user, attr)
    return None

def get_current_user(
    db: Session = Depends(get_db),
    authorization: str | None = Header(default=None),
) -> User:
    if not authorization or not authorization.lower().startswith("bearer "):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="인증 토큰이 없습니다.")
    token = authorization.split(" ", 1)[1]
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        sub = payload.get("sub")
        if not sub:
            raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="잘못된 토큰")
        user = db.query(User).get(int(sub))
        if not user:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="사용자를 찾을 수 없습니다.")
        return user
    except JWTError:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="토큰 검증 실패")


class RegisterIn(BaseModel):
    name: constr(min_length=1)
    email: EmailStr
    password: constr(min_length=6)

class LoginIn(BaseModel):
    email: EmailStr
    password: str

class TokenOut(BaseModel):
    access_token: str
    token_type: str = "bearer"

def get_user_by_email(db: Session, email: str):
    return db.query(User).filter(User.email == email).first()

@router.post("/register")
def register(payload: RegisterIn, db: Session = Depends(get_db)):
    print("회원가입 시도:", payload.dict())
    email_norm = normalize_email(payload.email)

    try:
        if get_user_by_email(db, email_norm):
            raise HTTPException(status_code=status.HTTP_409_CONFLICT,
                                detail="이미 존재하는 이메일입니다.")

        hashed_pw = pwd_context.hash(payload.password)

        # 가능한 필드명에 맞춰 저장
        kwargs = dict(name=payload.name, email=email_norm)
        if hasattr(User, "password_hash"):
            kwargs["password_hash"] = hashed_pw
        elif hasattr(User, "hashed_password"):
            kwargs["hashed_password"] = hashed_pw
        else:
            kwargs["password"] = hashed_pw  # 최후의 수단

        user = User(**kwargs)
        db.add(user)
        db.commit()
        db.refresh(user)
        print("✅ 저장 완료:", user.id, user.email)
        return {"msg": "회원가입이 완료되었습니다.",
                "user": {"id": user.id, "name": user.name, "email": user.email}}

    except IntegrityError:
        db.rollback()
        raise HTTPException(status_code=status.HTTP_409_CONFLICT,
                            detail="이미 존재하는 이메일입니다.")

@router.post("/login", response_model=TokenOut)
def login_json(payload: LoginIn, db: Session = Depends(get_db)):
    print("🔐 로그인 시도(JSON):", payload.dict())
    email_norm = normalize_email(payload.email)

    user = get_user_by_email(db, email_norm)
    if not user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND,
                            detail="사용자가 존재하지 않습니다.")

    stored_hash = get_user_password_hash(user)
    if not stored_hash:
        # 모델이 비밀번호 컬럼을 전혀 안 가질 때
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                            detail="서버 비밀번호 필드 미설정")

    try:
        ok = pwd_context.verify(payload.password, stored_hash)
    except Exception as e:
        print("❌ verify 에러:", e)
        ok = False

    if not ok:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED,
                            detail="비밀번호가 일치하지 않습니다.")

    token = create_access_token(sub=str(user.id))
    print("✅ 로그인 성공:", user.email)
    return {"access_token": token, "token_type": "bearer"}

@router.post("/token", response_model=TokenOut)
def login_form(
    username: str = Form(...),
    password: str = Form(...),
    db: Session = Depends(get_db),
):
    # form-urlencoded 버전(옵션)
    email_norm = normalize_email(username)
    user = get_user_by_email(db, email_norm)
    if not user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND,
                            detail="사용자가 존재하지 않습니다.")

    stored_hash = get_user_password_hash(user)
    if not stored_hash:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                            detail="서버 비밀번호 필드 미설정")

    try:
        ok = pwd_context.verify(password, stored_hash)
    except Exception as e:
        print("❌ verify 에러:", e)
        ok = False

    if not ok:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED,
                            detail="비밀번호가 일치하지 않습니다.")

    token = create_access_token(sub=str(user.id))
    return {"access_token": token, "token_type": "bearer"}

@router.get("/me")
def read_me(current: User = Depends(get_current_user)):
    return {"id": current.id, "name": current.name or "", "email": current.email}