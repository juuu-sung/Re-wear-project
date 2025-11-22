from sqlalchemy.orm import Session
from sqlalchemy import select
from typing import Optional, List
from app.models.user import User
from app.schemas.user import UserCreate, UserUpdate
from passlib.context import CryptContext # 👈 비밀번호 암호화를 위해 추가
from app.schemas.user import RegisterIn # 👈 UserCreate 대신 RegisterIn 사용

pwd_context = CryptContext(schemes=["pbkdf2_sha256"], deprecated="auto") # 👈 암호화 설정 추가

def get_by_id(db: Session, user_id: int) -> Optional[User]:
    return db.get(User, user_id)

def get_by_kakao_id(db: Session, *, kakao_id: int):
    return db.query(User).filter(User.kakao_id == kakao_id).first()

def get_by_email(db: Session, email: str) -> Optional[User]:
    return db.execute(select(User).where(User.email == email)).scalar_one_or_none()

def list_users(db: Session, skip: int = 0, limit: int = 50) -> List[User]:
    return db.execute(select(User).offset(skip).limit(limit)).scalars().all()

def create_user(db: Session, *, user_in: RegisterIn, kakao_id: int = None) -> User:
    """
    일반 회원가입과 카카오 회원가입을 모두 처리하는 통합 함수.
    """
    # 1. 카카오 가입이 아닐 경우에만 이메일 중복 체크
    if not kakao_id and get_by_email(db, email=user_in.email):
        raise ValueError("EMAIL_ALREADY_EXISTS")

    # 2. 비밀번호 암호화 (카카오 가입 시에는 user_in.password가 임시값이므로 그대로 사용)
    hashed_password = pwd_context.hash(user_in.password)

    # 3. User 모델 객체 생성
    db_user = User(
        email=user_in.email,
        name=user_in.name,
        hashed_password=hashed_password, # ✅ 암호화된 비밀번호 저장
        phone_number=user_in.phone_number,
        kakao_id=kakao_id               # ✅ kakao_id 저장
    )

    db.add(db_user)
    db.commit()
    db.refresh(db_user)
    return db_user

def update_user(db: Session, user_id: int, data: UserUpdate) -> Optional[User]:
    obj = get_by_id(db, user_id)
    if not obj:
        return None
    if data.name is not None:
        obj.name = data.name
    db.commit()
    db.refresh(obj)
    return obj

def delete_user(db: Session, user_id: int) -> bool:
    obj = get_by_id(db, user_id)
    if not obj:
        return False
    db.delete(obj)
    db.commit()
    return True

def update_profile_image(db: Session, user_id: int, image_url: str):
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        return None
    user.profile_image = image_url
    db.commit()
    db.refresh(user)
    return user
