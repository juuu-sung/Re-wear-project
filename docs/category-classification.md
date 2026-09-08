# 의류 소재·카테고리 동시 분류

2026-09-09부터 기본 모델은 사용자 제공 `best_최종.pt`를 복사한 `backend/app/models/best_multitask.pt`입니다. EfficientNet-B0 공유부에서 소재/카테고리 분기를 분리하고 소재 분기에 ECA attention을 적용합니다.

## 동작

- 옷 등록의 **자동 분류**는 사진을 한 번 모델에 입력해 소재 8종 후보와 의류 유형 12종 중 하나를 분석합니다. 카테고리 분류에 Gemini 사진 전송은 하지 않습니다.
- 소재: cotton, nylon, polyester, rayon, silk, spandex, synthetic, wool. sigmoid 확률에 새 체크포인트의 평가 기준인 0.5를 적용합니다. 이전 모델 전용 `thresholds_per_class_v3.json`은 새 모델에 적용하지 않습니다.
- 카테고리: blouse, cardigan, coat, jacket, jumper, shirt, sweater, t-shirt, vest, bottom, onepiece(dress), onepiece(jumpsuite). softmax로 가장 높은 후보를 선택합니다. `multitask_config.json`에서 한글 이름 12종(블라우스, 가디건, 코트, 재킷, 점퍼, 셔츠, 스웨터, 티셔츠, 조끼, 하의, 원피스, 점프수트)을 매핑합니다.
- DB에는 해당 한글 세부 유형을 그대로 저장하며 등록·수정 선택지, 옷장 필터, 상세 화면에서도 같은 이름을 사용합니다. `기타`와 `미분류`는 예외 처리용으로 유지합니다. 유형과 확률은 등록 응답 `ai.category_prediction` 및 추론 응답 `category`, `category_top3`로 반환합니다.
- 옷장과 옷 선택 창은 `전체`에서 시작하며, 기존 큰 분류·사용자 정의 옷장도 필터에 포함합니다. 세탁 알림 계산은 설정의 `group`으로 기존 큰 분류 기준을 유지합니다.
- 수동 선택한 카테고리와 사용자 정의 옷장 이름은 예측보다 우선합니다. 기존 의류의 카테고리도 자동으로 바꾸지 않습니다.
- 사진 교체/AI 재분석은 새 모델로 소재를 다시 계산합니다. 사용자가 지정한 옷장 분류는 보존합니다.
- 세탁 설명 생성은 기존 Gemini 연동을 유지합니다.

이 카테고리 모델은 12종 중 하나를 선택하는 폐쇄형 분류 모델이며, 의류가 아닌 사진/학습 범위 밖 의류를 거절하는 별도 검출기는 없습니다. 예측값은 추정치이며 잘못 분류된 옷은 직접 수정해야 합니다. 소재 확률은 혼용률이 아닙니다.

## 설정·호환성

기본 경로는 새 모델입니다. `FABRIC_CKPT`가 설정되어 있으면 그 경로가 우선하므로 기존 환경에서는 값을 `backend/app/models/best_multitask.pt`로 변경해야 합니다. 이번 작업에서는 로컬 `backend/.env`의 경로도 변경했습니다.

이전 소재 전용 모델은 `FABRIC_CKPT=backend/app/models/best_ml.pt`로 되돌릴 수 있습니다. 이 경우 기존 임계값·소재 사전 설정과 Gemini 카테고리 fallback을 사용합니다. 새 모델 실패 시 자동으로 이전 모델로 바꾸지는 않습니다.

라벨 목록·순서와 전처리(352×352 Resize, ImageNet Normalize)는 로컬 논문 코드에서 찾은 `train_b_datacrops_only_phase2a_final_shared_trunk_vit_small_server.py`를 기준으로 옮겼습니다. 해당 코드의 `EffB0MultiHead_Late2Branch`에 `mat_attn_type=eca`, `cat_attn_type=none`, `head_type=linear`를 적용한 구조와 가중치 키/형상이 일치합니다. 체크포인트 자체에는 라벨 사전이 없으므로 다른 학습 실행에서 라벨 순서를 변경했다면 배포 전에 확인해야 합니다. 체크포인트 및 참조 코드 SHA-256은 설정 파일에 기록했습니다.

새 체크포인트와 설정의 SHA-256이 다르거나 모델 구조/클래스 수가 맞지 않으면 로드를 거부합니다. 학습 가중치 파일은 `weights_only=True`로 읽습니다. DB 마이그레이션이나 새 패키지 설치는 필요하지 않습니다.

## 검증

`backend`에서 기존 가상환경으로 실행합니다.

```bash
venv/bin/python -m unittest discover -s tests -p 'test_category_infer.py' -v
venv/bin/python -m unittest discover -s tests -p 'test_multitask_model.py' -v
```

검증 내용: 새 모델 실제 로드/추론, 소재·카테고리 응답, 모델/라벨 설정 불일치 거부, 기존 소재 모델 호환, 로컬 카테고리 우선 처리, 수동 선택 보존, 기존 multipart 등록 API. 참조 학습 모델과 동일 입력의 두 출력 텐서가 완전히 일치하는 것도 별도로 확인했습니다. 이는 새 검증 데이터셋에서의 정확도 평가를 대신하지 않습니다.
