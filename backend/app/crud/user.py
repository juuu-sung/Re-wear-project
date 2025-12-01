from sqlalchemy.orm import Session
from sqlalchemy import select
from typing import Optional, List
from app.models.user import User
from app.schemas.user import UserUpdate, RegisterIn
from passlib.context import CryptContext

# 🔥 auth.py와 동일하게 세팅 (중요!)
pwd_context = CryptContext(
    schemes=["bcrypt", "pbkdf2_sha256"],
    deprecated="auto"
)

def get_by_id(db: Session, user_id: int) -> Optional[User]:
    return db.get(User, user_id)


def get_by_kakao_id(db: Session, *, kakao_id: int):
    return db.query(User).filter(User.kakao_id == kakao_id).first()


def get_by_email(db: Session, email: str) -> Optional[User]:
    return db.execute(select(User).where(User.email == email)).scalar_one_or_none()


def list_users(db: Session, skip: int = 0, limit: int = 50) -> List[User]:
    return db.execute(select(User).offset(skip).limit(limit)).scalars().all()


def create_user(db: Session, *, user_in: RegisterIn, kakao_id: int = None) -> User:
    # 이메일 중복 체크
    if not kakao_id and get_by_email(db, user_in.email):
        raise ValueError("EMAIL_ALREADY_EXISTS")

    # 🔥 auth.py와 동일한 방식으로 hash 생성
    hashed_password = pwd_context.hash(str(user_in.password))

    db_user = User(
        email=user_in.email,
        name=user_in.name,
        hashed_password=hashed_password,
        phone_number=user_in.phone_number,
        kakao_id=kakao_id,
    )

    db.add(db_user)
    db.commit()
    db.refresh(db_user)
    return db_user


# ==========================================================
# 🔥 계정 정보 수정 (name + password 변경)
# ==========================================================
def update_user(db: Session, user_id: int, data: UserUpdate) -> Optional[User]:
    obj = get_by_id(db, user_id)
    if not obj:
        return None

    # 이름 변경
    if data.name is not None:
        obj.name = data.name

    # 🔥 비밀번호 변경 (auth.py 방식과 동일)
    if data.password is not None and data.password != "":
        # 기존 비밀번호와 동일한지 검사
        try:
            if pwd_context.verify(data.password, obj.hashed_password):
                raise ValueError("PASSWORD_SAME_AS_OLD")
        except Exception:
            # verify 불가해도 무시하고 새 비밀번호로 덮어쓰기
            pass

        # 길이 제한 검사
        if len(data.password.encode("utf-8")) > 72:
            raise ValueError("PASSWORD_TOO_LONG")

        # 🔥 auth.py와 동일한 bcrypt/pbkdf2 자동 hash
        new_hash = pwd_context.hash(str(data.password))
        obj.hashed_password = new_hash

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
