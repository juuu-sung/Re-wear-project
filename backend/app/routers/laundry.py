# /backend/app/routers/laundry.py (새 파일 예시)

from fastapi import APIRouter, UploadFile, File
from ultralytics import YOLO
import io
from PIL import Image

router = APIRouter()

# 1. Colab에서 다운로드한 'best.pt' 파일 경로
# (이 파일은 백엔드 프로젝트 어딘가에 있어야 합니다)
MODEL_PATH = "app/models/best.pt" 

# 2. 모델을 미리 로드합니다. (서버 켤 때 한 번만)
try:
    model = YOLO(MODEL_PATH)
    print("YOLOv8 모델 로드 성공!")
except Exception as e:
    print(f"YOLOv8 모델 로드 실패: {e}")
    model = None


@router.post("/scan", summary="케어라벨 스캔 API")
async def scan_care_label(file: UploadFile = File(...)):
    """
    앱에서 케어라벨 이미지를 받아 YOLOv8 모델로 분석합니다.
    (좌표값 'box' 키가 추가되었습니다.)
    """
    if not model:
        return {"error": "모델이 로드되지 않았습니다."}, 500

    contents = await file.read()
    image = Image.open(io.BytesIO(contents))

    try:
        # 1. YOLOv8 모델로 예측(inference)을 실행합니다.
        results = model(image) 
        result = results[0] # 첫 번째 결과 사용
        
        detections = []
        
        # --- 👇 여기가 바뀝니다! ---
        
        # 2. 결과에서 [박스], [클래스], [확신도]를 한번에 추출
        boxes = result.boxes.xyxyn.tolist()     # [x1, y1, x2, y2] (0~1 정규화 좌표)
        classes = result.boxes.cls.tolist()     # [클래스 ID]
        confidences = result.boxes.conf.tolist()  # [확신도]

        # 3. 결과를 조합해서 JSON으로 가공합니다.
        for box, cls_id, conf in zip(boxes, classes, confidences):
            detections.append({
                "class_name": result.names[int(cls_id)],
                "confidence": round(conf, 2),
                
                # 🚨 (중요!) 이 'box' 객체가 새로 추가되었습니다.
                "box": {
                    "x1": box[0], # (0~1 사이의 값)
                    "y1": box[1], # (0~1 사이의 값)
                    "x2": box[2], # (0~1 사이의 값)
                    "y2": box[3], # (0~1 사이의 값)
                }
            })
        # --- 👆 여기까지 ---

        return {"detections": detections}

    except Exception as e:
        print(f"모델 예측 오류: {e}")
        return {"error": f"모델 예측 중 오류 발생: {e}"}, 500
# ----------------------------------------------------