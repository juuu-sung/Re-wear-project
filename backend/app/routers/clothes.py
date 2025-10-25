from fastapi import APIRouter, Depends, HTTPException, UploadFile, Form, File
from sqlalchemy.orm import Session
from typing import List
import os, shutil, json

from app.db import get_db
from app.models.clothes import Clothes
from app.models.user import User
from app.routers.auth import get_current_user

from app.routers.care import CareSummaryResponse
from app.services.care_instructions import explain
from app.services.material_infer import predict_bytes
from app.services.wash_guide import guide_for

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

    # ✅ 저장 직후 AI 추론 수행 (업로드 파일 재열기)
    with open(path, "rb") as f:
        infer = predict_bytes(f.read())
    # 최종 멀티라벨(predicted) 중 가장 높은 후보를 소재로 사용(간단화)
    top1 = infer["top5"][0]["name"] if infer.get("top5") else None
    material = (infer["predicted"][0] if infer.get("predicted") else top1) or None
    washing = guide_for(material) if material else None
    breakdown = json.dumps(infer.get("top5", []), ensure_ascii=False) if infer.get("top5") else None

    new_item = Clothes(
        user_id=current_user.id,
        name=name,
        category=category,
        image_path=filename,
        material=material,
        washing_info=(None if washing is None else json.dumps(washing, ensure_ascii=False)),
        material_breakdown=breakdown,
    )
    db.add(new_item)
    db.commit()
    db.refresh(new_item)

    return {
        "ok": True,
        "id": new_item.id,
        "name": name,
        "category": category,
        "image_path": filename,
        "ai": {
            "material": material,
            "top5": infer.get("top5"),
            "washing": washing,
        },
        "material_breakdown": breakdown,
    }

# ✅ 옷 목록 조회
@router.get("", response_model=List[dict])
def list_clothes(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    items = db.query(Clothes).filter(Clothes.user_id == current_user.id).all()
    out = []
    for i in items:
        out.append({
            "id": i.id,
            "name": i.name,
            "category": i.category,
            "image_path": i.image_path,
            "material": i.material,
            "washing_info": i.washing_info,  # JSON string
            "material_breakdown": i.material_breakdown,
        })
    return out

# ✅ 옷 수정 (세탁법 수동 수정 + 이미지 변경 시 재분석 둘 다 지원)
@router.put("/{item_id}")
async def update_clothes(
    item_id: int,
    name: str = Form(...),
    category: str = Form(...),
    image: UploadFile | None = File(None),
    washing_info: str | None = Form(None),     # ★ 추가
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    item = db.query(Clothes).filter(
        Clothes.id == item_id, Clothes.user_id == current_user.id
    ).first()
    if not item:
        raise HTTPException(status_code=404, detail="Item not found")

    item.name = name
    item.category = category

    if image:
        filename = f"{current_user.id}_{image.filename}"
        file_path = os.path.join(UPLOAD_DIR, filename)
        with open(file_path, "wb") as buffer:
            shutil.copyfileobj(image.file, buffer)
        item.image_path = filename

        # 이미지 바뀌면 AI 재분석으로 갱신
        with open(file_path, "rb") as f:
            infer = predict_bytes(f.read())
        top1 = infer["top5"][0]["name"] if infer.get("top5") else None
        item.material = (infer["predicted"][0] if infer.get("predicted") else top1) or None
        item.washing_info = json.dumps(guide_for(item.material), ensure_ascii=False)
        item.material_breakdown = json.dumps(infer.get("top5", []), ensure_ascii=False) if infer.get("top5") else None
    else:
        # 이미지 안 바뀌었고 프론트에서 세탁법을 보내주면 그 값 반영
        if washing_info is not None:
            item.washing_info = washing_info

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

# 사진을 바꾸거나 사용자가 눌러서 재분석
@router.post("/analyze/{item_id}")
def analyze_item(
    item_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    item = db.query(Clothes).filter(
        Clothes.id == item_id, Clothes.user_id == current_user.id
    ).first()
    if not item:
        raise HTTPException(status_code=404, detail="Item not found")

    file_path = os.path.join(UPLOAD_DIR, item.image_path) if item.image_path else None
    if not file_path or not os.path.exists(file_path):
        raise HTTPException(status_code=400, detail="이미지가 없습니다.")

    with open(file_path, "rb") as f:
        infer = predict_bytes(f.read())

    top1 = infer["top5"][0]["name"] if infer.get("top5") else None
    material = (infer["predicted"][0] if infer.get("predicted") else top1) or None
    washing = guide_for(material) if material else None

    item.material = material
    item.washing_info = None if washing is None else json.dumps(washing, ensure_ascii=False)
    item.material_breakdown = json.dumps(infer.get("top5", []), ensure_ascii=False) if infer.get("top5") else None
    db.commit()
    db.refresh(item)

    return {
        "ok": True,
        "material": material,
        "top5": infer.get("top5"),
        "washing": washing,
        "material_breakdown": item.material_breakdown,
    }

# 특정 옷에 대해 생성/저장 API
@router.post("/{cid}/care-summary", response_model=CareSummaryResponse)
def generate_and_save_care_summary(
    cid: int,
    db: Session = Depends(get_db),
):
    item = db.query(Clothes).get(cid)
    if not item:
        raise HTTPException(404, "not found")

    # washing_info는 item.washing(json/text), material, breakdown 등 네 데이터 구조에 맞게:
    washing = item.washing_info or item.washing or ""
    candidates = item.material_breakdown or []  # [{"label":"cotton","prob":0.7}, ...]
    try:
        text = explain(
            material=item.material,
            candidates_raw=candidates,
            washing=washing,
            locale="ko"
        )
        item.care_summary = text
        db.add(item)
        db.commit()
        return {"summary": text}
    except Exception as e:
        raise HTTPException(502, f"gemini failed: {e}")
