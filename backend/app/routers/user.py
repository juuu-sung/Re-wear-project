from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List

from app.db import SessionLocal
from app.schemas.user import UserCreate, UserUpdate, UserOut
from app.crud import user as crud_user

router = APIRouter(prefix="/users", tags=["users"])

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

@router.post("", response_model=UserOut, status_code=status.HTTP_201_CREATED)
def create_user(payload: UserCreate, db: Session = Depends(get_db)):
    try:
        return crud_user.create_user(db, payload)
    except ValueError as e:
        if str(e) == "EMAIL_ALREADY_EXISTS":
            raise HTTPException(status_code=400, detail="Email already exists")
        raise

@router.get("", response_model=List[UserOut])
def list_users(skip: int = 0, limit: int = 50, db: Session = Depends(get_db)):
    return crud_user.list_users(db, skip=skip, limit=limit)

@router.get("/{user_id}", response_model=UserOut)
def get_user(user_id: int, db: Session = Depends(get_db)):
    obj = crud_user.get_by_id(db, user_id)
    if not obj:
        raise HTTPException(status_code=404, detail="User not found")
    return obj

@router.patch("/{user_id}", response_model=UserOut)
def update_user(user_id: int, payload: UserUpdate, db: Session = Depends(get_db)):
    obj = crud_user.update_user(db, user_id, payload)
    if not obj:
        raise HTTPException(status_code=404, detail="User not found")
    return obj

@router.delete("/{user_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_user(user_id: int, db: Session = Depends(get_db)):
    ok = crud_user.delete_user(db, user_id)
    if not ok:
        raise HTTPException(status_code=404, detail="User not found")
    return
