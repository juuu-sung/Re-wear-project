# backend/app/routers/user.py
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List

from app.db import SessionLocal
from app.schemas.user import UserCreate, UserUpdate, UserOut, RegisterIn  # RegisterIn: name/email/password 포함, password max_length=72
from app.crud import user as crud_user

# 기존 users 라우터
router = APIRouter(prefix="/users", tags=["users"])

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

# --- 회원가입 구현 공통부 -------------------------------------------------
def _register_impl(payload: RegisterIn, db: Session) -> UserOut:
    # bcrypt 평문 제한(72 bytes) 방어: 이모지/한글 포함 대비해 바이트 기준 검사
    if len(payload.password.encode("utf-8")) > 72:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Password must be ≤ 72 bytes."
        )
    try:
        # 실제 생성 로직은 CRUD로 위임 (여기서 해싱/중복 이메일 검사 수행)
        return crud_user.create_user(db, payload)
    except ValueError as e:
        msg = str(e)
        if msg == "EMAIL_ALREADY_EXISTS":
            raise HTTPException(status_code=400, detail="Email already exists")
        if msg == "PASSWORD_TOO_LONG":
            # CRUD 내부에서 감지했을 때도 동일 메시지
            raise HTTPException(status_code=400, detail="Password must be ≤ 72 bytes.")
        # 알 수 없는 에러는 500으로 래핑
        raise HTTPException(status_code=500, detail="DB 저장 실패")

# --- 엔드포인트들 ---------------------------------------------------------

# (1) 기존 POST /users  → 그대로 두되, UserCreate를 쓰는 경우 유지
@router.post("", response_model=UserOut, status_code=status.HTTP_201_CREATED)
def create_user(payload: UserCreate, db: Session = Depends(get_db)):
    # 만약 UserCreate가 비밀번호를 안 갖는다면 이 엔드포인트는 팀 내 관리용으로 두고,
    # 실제 회원가입은 아래 /users/register 또는 /auth/register 사용
    try:
        return crud_user.create_user(db, payload)
    except ValueError as e:
        if str(e) == "EMAIL_ALREADY_EXISTS":
            raise HTTPException(status_code=400, detail="Email already exists")
        raise HTTPException(status_code=500, detail="DB 저장 실패")

# (2) POST /users/register  → 회원가입(프론트에서 이 경로를 써도 됨)
@router.post("/register", response_model=UserOut, status_code=status.HTTP_201_CREATED)
def register_user(payload: RegisterIn, db: Session = Depends(get_db)):
    return _register_impl(payload, db)

# 조회/수정/삭제
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

# --- /auth/register 호환 라우터 (프론트가 이미 이 경로를 쓰고 있을 때) ---
auth_router = APIRouter(prefix="/auth", tags=["auth"])

@auth_router.post("/register", response_model=UserOut, status_code=status.HTTP_201_CREATED)
def register_user_auth(payload: RegisterIn, db: Session = Depends(get_db)):
    return _register_impl(payload, db)
