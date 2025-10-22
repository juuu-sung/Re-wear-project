# app/routers/infer_material.py
from fastapi import APIRouter, UploadFile, File, HTTPException
from fastapi.responses import JSONResponse
from app.services.material_infer import predict_bytes

router = APIRouter(prefix="/v1/infer", tags=["infer"])

@router.post("/material")
async def infer_material(file: UploadFile = File(...)):
    if file.content_type not in {"image/jpeg", "image/png", "image/webp"}:
        raise HTTPException(400, "지원 이미지 타입: jpg/png/webp")
    try:
        content = await file.read()
        result = predict_bytes(content)
        return JSONResponse(result)
    except Exception as e:
        raise HTTPException(500, f"Inference error: {e}")
