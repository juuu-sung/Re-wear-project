from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field
from typing import Any, List, Optional, Dict
from app.services.care_instructions import explain, GeminiError

router = APIRouter(prefix="/care", tags=["care"])

class MaterialCandidate(BaseModel):
    label: str
    prob: Optional[float] = Field(None, ge=0, le=1)

class CareSummaryRequest(BaseModel):
    material: Optional[str] = None
    candidates: Optional[List[MaterialCandidate]] = None
    washing: Any  # dict or string OK
    locale: Optional[str] = "ko"
    force_auto: bool = False

class CareSummaryResponse(BaseModel):
    summary: str

@router.post("/summary", response_model=CareSummaryResponse)
def care_summary(req: CareSummaryRequest):
    try:
        text = explain(
            material=req.material,
            candidates_raw=[c.dict() for c in (req.candidates or [])],
            washing=req.washing,
            locale=req.locale or "ko",
            force_auto=req.force_auto,
        )
        return CareSummaryResponse(summary=text)
    except GeminiError as e:
        raise HTTPException(status_code=502, detail=f"Gemini error: {e}")
    except Exception as e:
        raise HTTPException(status_code=500, detail="internal error")