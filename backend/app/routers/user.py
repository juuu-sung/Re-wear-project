# backend/app/routers/user.py
import os
import shutil
import uuid
from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File
from sqlalchemy.orm import Session
from typing import List
from pydantic import BaseModel
from app.db import SessionLocal
from app.schemas.user import UserCreate, UserUpdate, UserOut, RegisterIn  # RegisterIn: name/email/password 포함
from app.crud import user as crud_user
from app.routers.auth import get_current_user, verify_password 
from app.models import User

#  [추가] 삭제 요청 시 받을 데이터 (비밀번호)
class UserDeleteRequest(BaseModel):
    password: str

class PasswordCheckRequest(BaseModel):
    password: str
    
# 기존 users 라우터
router = APIRouter(prefix="/users", tags=["users"])

PROFILE_UPLOAD_DIR = "uploads/profile"
os.makedirs(PROFILE_UPLOAD_DIR, exist_ok=True)
BASE_URL = os.getenv("EXTERNAL_BASE_URL", "http://localhost:8000")

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

# --- 회원가입 구현 공통부 -------------------------------------------------
def _register_impl(payload: RegisterIn, db: Session) -> UserOut:
    try:
        # 실제 생성 로직은 CRUD로 위임 (여기서 해싱/중복 이메일 검사 수행)
        return crud_user.create_user(db, payload)
    except ValueError as e:
        msg = str(e)
        if msg == "EMAIL_ALREADY_EXISTS":
            raise HTTPException(status_code=400, detail="Email already exists")
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

#   [추가] 사용자 정보 조회 API (GET /users/{user_id})
@router.get("/{user_id}", response_model=UserOut)
def read_user(user_id: int, db: Session = Depends(get_db)):
    # DB에서 ID로 유저 찾기
    db_user = crud_user.get_by_id(db, user_id)
    
    if db_user is None:
        raise HTTPException(status_code=404, detail="User not found")
        
    return db_user

@router.patch("/{user_id}", response_model=UserOut)
def update_user(user_id: int, payload: UserUpdate, db: Session = Depends(get_db)):
    try:
        obj = crud_user.update_user(db, user_id, payload)
    except ValueError as e:
        msg = str(e)
        if msg == "PASSWORD_SAME_AS_OLD":
            raise HTTPException(status_code=400, detail="기존 비밀번호와 동일합니다.")
        raise e

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


@router.post("/{user_id}/profile-image")
async def upload_profile_image(
    user_id: int,
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
):
    user = crud_user.get_by_id(db, user_id)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    ext = "jpg"
    if file.filename and "." in file.filename:
        ext = file.filename.rsplit(".", 1)[-1]
    filename = f"{user_id}_{uuid.uuid4().hex}.{ext}"
    save_path = os.path.join(PROFILE_UPLOAD_DIR, filename)

    with open(save_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)

    image_url = f"{BASE_URL}/uploads/profile/{filename}"
    crud_user.update_profile_image(db, user_id, image_url)

    return {"url": image_url}

@router.post("/delete", summary="회원 탈퇴")
def delete_my_account(
    req: UserDeleteRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user) # 로그인한 사용자 정보 주입
):
    # 1. 비밀번호 검증
    # (current_user.hashed_password는 DB에 저장된 암호화된 비밀번호입니다)
    if not verify_password(req.password, current_user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="비밀번호가 일치하지 않습니다."
        )

    # 2. DB에서 사용자 삭제
    # (기존에 만들어져 있던 crud_user.delete_user 함수 재사용)
    deleted = crud_user.delete_user(db, current_user.id)
    
    if not deleted:
         raise HTTPException(status_code=404, detail="User not found")

    return {"message": "계정이 성공적으로 삭제되었습니다."}

@router.post("/check-password", summary="비밀번호 확인(본인인증)")
def check_password(
    req: PasswordCheckRequest,
    current_user: User = Depends(get_current_user)
):
    if not verify_password(req.password, current_user.hashed_password):
        raise HTTPException(status_code=400, detail="비밀번호가 일치하지 않습니다.")
    return {"valid": True}
