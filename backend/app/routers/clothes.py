from fastapi import APIRouter, Depends, HTTPException, UploadFile, Form, File
from sqlalchemy.orm import Session
from typing import List
import os, shutil

from app.db import get_db
from app.models.clothes import Clothes
from app.models.user import User
from app.routers.auth import get_current_user

router = APIRouter(prefix="/clothes", tags=["Clothes"])

UPLOAD_DIR = "uploads/clothes"
os.makedirs(UPLOAD_DIR, exist_ok=True)

# ✅ 옷 등록
@router.post("/add")
async def add_clothes(
    name: str = Form(...),
    category: str = Form(...),
    image: UploadFile = File(...),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    filename = f"{current_user.id}_{image.filename}"
    path = os.path.join(UPLOAD_DIR, filename)
    with open(path, "wb") as buffer:
        shutil.copyfileobj(image.file, buffer)

    new_item = Clothes(
        user_id=current_user.id,
        name=name,
        category=category,
        image_path=filename,
    )
    db.add(new_item)
    db.commit()
    db.refresh(new_item)
    return {"ok": True, "id": new_item.id, "name": name, "category": category}

# ✅ 옷 목록 조회
@router.get("", response_model=List[dict])
def list_clothes(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    items = db.query(Clothes).filter(Clothes.user_id == current_user.id).all()
    return [
        {"id": i.id, "name": i.name, "category": i.category, "image_path": i.image_path}
        for i in items
    ]

# ✅ 옷 수정
@router.put("/{item_id}")
async def update_clothes(
    item_id: int,
    name: str = Form(...),
    category: str = Form(...),
    image: UploadFile | None = File(None),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    item = db.query(Clothes).filter(
        Clothes.id == item_id, Clothes.user_id == current_user.id
    ).first()
    if not item:
        raise HTTPException(status_code=404, detail="Item not found")

    if image:
        filename = f"{current_user.id}_{image.filename}"
        file_path = os.path.join(UPLOAD_DIR, filename)
        with open(file_path, "wb") as buffer:
            shutil.copyfileobj(image.file, buffer)
        item.image_path = filename

    item.name = name
    item.category = category
    db.commit()
    db.refresh(item)
    return {"ok": True, "updated": item.id}

# ✅ 옷 삭제
@router.delete("/{item_id}")
def delete_clothes(
    item_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    item = db.query(Clothes).filter(
        Clothes.id == item_id, Clothes.user_id == current_user.id
    ).first()
    if not item:
        raise HTTPException(status_code=404, detail="Item not found")

    if item.image_path:
        try:
            os.remove(os.path.join(UPLOAD_DIR, item.image_path))
        except FileNotFoundError:
            pass

    db.delete(item)
    db.commit()
    return {"ok": True, "deleted": item_id}
