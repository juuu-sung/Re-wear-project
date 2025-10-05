# backend/app/routers/auth.py
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.db import get_db
from app.models.user import User
from passlib.context import CryptContext
from pydantic import BaseModel, EmailStr, constr
from jose import jwt
from sqlalchemy.exc import IntegrityError
from fastapi import APIRouter, Depends, HTTPException, status
import os, datetime


router = APIRouter(prefix="/auth", tags=["Auth"])

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
SECRET_KEY = os.getenv("SECRET_KEY", "dev_secret")

class RegisterIn(BaseModel):
    name: constr(min_length=1)
    email: EmailStr
    password: constr(min_length=6)

class LoginIn(BaseModel):
    email: EmailStr
    password: str


@router.post("/register")
def register(payload: RegisterIn, db: Session = Depends(get_db)):
    print("회원가입 시도:", payload.dict())
    try:
        # 1️⃣ 이메일 중복 확인
        existing_user = db.query(User).filter(User.email == payload.email).first()
        if existing_user:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="이미 존재하는 이메일입니다."
            )

        # 2️⃣ 비밀번호 해시 후 새 유저 생성
        hashed_pw = pwd_context.hash(payload.password)
        user = User(
            name=payload.name,
            email=payload.email,
            password=hashed_pw
        )

        # 3️⃣ DB에 저장
        db.add(user)
        db.commit()
        db.refresh(user)

        print("✅ 저장 완료:", user.id, user.email)
        return {
            "msg": "회원가입이 완료되었습니다.",
            "user": {"name": user.name, "email": user.email}
        }

    except IntegrityError as e:
        db.rollback()
        print("❌ 무결성 오류:", str(e))
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="이미 존재하는 이메일입니다."
        )

    except HTTPException:
        # 이미 위에서 발생한 예외는 FastAPI가 알아서 처리
        raise

    except Exception as e:
        db.rollback()
        print("❌ 알 수 없는 DB 오류:", str(e))
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="DB 저장 실패: " + str(e)
        )
@router.post("/login")
def login(payload: LoginIn, db: Session = Depends(get_db)):
    print("🔐 로그인 시도:", payload.dict())

    # 1️⃣ 이메일로 사용자 조회
    user = db.query(User).filter(User.email == payload.email).first()
    if not user:
        print("❌ 존재하지 않는 이메일:", payload.email)
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="사용자가 존재하지 않습니다."
        )

    # 2️⃣ 비밀번호 일치 여부 확인
    if not pwd_context.verify(payload.password, user.password):
        print("❌ 비밀번호 불일치:", payload.email)
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="비밀번호가 일치하지 않습니다."
        )

    # 3️⃣ JWT 토큰 생성
    payload_data = {
        "user_id": user.id,
        "email": user.email,
        "exp": datetime.datetime.utcnow() + datetime.timedelta(hours=3)
    }
    token = jwt.encode(payload_data, SECRET_KEY, algorithm="HS256")

    print("✅ 로그인 성공:", user.email)
    return {
        "message": f"{user.name}님, 로그인 성공!",
        "access_token": token,
        "token_type": "bearer"
    }


