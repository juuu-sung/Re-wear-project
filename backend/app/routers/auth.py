from fastapi import APIRouter, Depends, HTTPException, status, Header
from sqlalchemy.orm import Session
from app.db import get_db
from app.models.user import User
from passlib.context import CryptContext
from pydantic import BaseModel, EmailStr, constr
from jose import jwt, JWTError
from sqlalchemy.exc import IntegrityError
import os, datetime

router = APIRouter(prefix="/auth", tags=["Auth"])

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
SECRET_KEY = os.getenv("SECRET_KEY", "dev_secret")
ALGORITHM = "HS256"

# ✅ 회원가입 요청 스키마
class RegisterIn(BaseModel):
    name: constr(min_length=1)
    email: EmailStr
    password: constr(min_length=6)

# ✅ 로그인 요청/응답 스키마
class LoginIn(BaseModel):
    email: EmailStr
    password: str

class TokenOut(BaseModel):
    access_token: str
    token_type: str = "bearer"


# ✅ 회원가입
@router.post("/register")
def register(payload: RegisterIn, db: Session = Depends(get_db)):
    print("회원가입 시도:", payload.dict())

    email_norm = payload.email.strip().lower()

    try:
        existing_user = db.query(User).filter(User.email == email_norm).first()
        if existing_user:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="이미 존재하는 이메일입니다."
            )

        hashed_pw = pwd_context.hash(payload.password)
        user = User(name=payload.name, email=email_norm, password=hashed_pw)
        db.add(user)
        db.commit()
        db.refresh(user)

        print("✅ 저장 완료:", user.id, user.email)
        return {
            "msg": "회원가입이 완료되었습니다.",
            "user": {"name": user.name, "email": user.email},
        }

    except IntegrityError:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="이미 존재하는 이메일입니다."
        )


# ✅ 로그인
@router.post("/login", response_model=TokenOut)
def login(payload: LoginIn, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == payload.email.strip().lower()).first()

    if not user or not pwd_context.verify(payload.password, user.password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="이메일 또는 비밀번호가 올바르지 않습니다."
        )

    # ✅ JWT 토큰 생성
    payload_jwt = {
        "sub": str(user.id),
        "email": user.email,
        "exp": datetime.datetime.utcnow() + datetime.timedelta(hours=12)
    }
    token = jwt.encode(payload_jwt, SECRET_KEY, algorithm=ALGORITHM)

    print(f"✅ 로그인 성공: {user.email}")
    return {"access_token": token, "token_type": "bearer"}


# ✅ 로그인한 사용자 정보 조회
@router.get("/me")
def get_me(authorization: str = Header(None), db: Session = Depends(get_db)):
    """
    Authorization 헤더에 있는 JWT 토큰으로 사용자 정보 조회
    """
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="인증 토큰이 필요합니다.")
    
    token = authorization.split(" ")[1]

    try:
        # JWT 토큰 검증
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        email = payload.get("email")

        if not email:
            raise HTTPException(status_code=401, detail="토큰에서 이메일을 찾을 수 없습니다.")

        user = db.query(User).filter(User.email == email).first()
        if not user:
            raise HTTPException(status_code=404, detail="사용자를 찾을 수 없습니다.")

        return {"name": user.name, "email": user.email}

    except JWTError:
        raise HTTPException(status_code=401, detail="유효하지 않은 토큰입니다.")
