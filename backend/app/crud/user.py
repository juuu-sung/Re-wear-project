from sqlalchemy.orm import Session
from sqlalchemy import select
from typing import Optional, List
from app.models.user import User
from app.schemas.user import UserCreate, UserUpdate

def get_by_id(db: Session, user_id: int) -> Optional[User]:
    return db.get(User, user_id)

def get_by_email(db: Session, email: str) -> Optional[User]:
    return db.execute(select(User).where(User.email == email)).scalar_one_or_none()

def list_users(db: Session, skip: int = 0, limit: int = 50) -> List[User]:
    return db.execute(select(User).offset(skip).limit(limit)).scalars().all()

def create_user(db: Session, data: UserCreate) -> User:
    if get_by_email(db, data.email):
        raise ValueError("EMAIL_ALREADY_EXISTS")
    obj = User(email=str(data.email), name=data.name)
    db.add(obj)
    db.commit()
    db.refresh(obj)
    return obj

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
