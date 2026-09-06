# 개발 가이드

모바일 앱과 FastAPI 서버를 각각 실행하는 구조입니다. **현재 저장소는 개발 중인 프로젝트로, 신규 환경에서는 누락된 의존성과 DB 스키마를 보완해야 합니다.** 아래는 코드에 기반한 환경 구성 안내이며, 새 환경에서의 전체 실행 검증은 아직 완료되지 않았습니다.

## 1. 사전 준비와 환경 변수

- Node.js **20.19.4 이상**과 npm: React Native 0.81.4의 `engines` 기준
- Python **3.10 이상**과 PostgreSQL: 백엔드 문법 요구사항 기준이며, AI 패키지와 호환되는 환경 필요
- Android Studio 또는 macOS의 Xcode: 네이티브 앱 빌드용
- Gemini API 키, 리폼 영상 검색용 YouTube Data API 키, Kakao 앱 설정

```bash
git clone https://github.com/juuu-sung/Re-wear-project.git
cd Re-wear-project
npm ci
```

프로젝트 루트에 `.env`를 만들고 앱이 접근할 서버 주소를 지정합니다.

```dotenv
EXPO_PUBLIC_BASE_URL=http://localhost:8000
```

iOS 시뮬레이터는 `localhost`, Android 에뮬레이터는 `10.0.2.2`, 실제 기기는 같은 네트워크에 있는 개발 PC의 IP 주소를 사용합니다. 일부 보조 API 파일에는 별도 주소가 남아 있으므로 연결 오류가 있으면 해당 화면의 API 주소도 확인합니다.

`backend/.env`에는 아래 값을 실제 개발 환경에 맞게 설정합니다.

```dotenv
DATABASE_URL=postgresql+psycopg://DB_USER:DB_PASSWORD@localhost:5432/rewear_db
SECRET_KEY=replace-with-a-random-secret
GEMINI_API_KEY=your-gemini-api-key
GEMINI_MODEL=your-available-gemini-model-id
YOUTUBE_API_KEY=your-youtube-data-api-key
```

`DATABASE_URL`은 사전에 생성한 PostgreSQL 사용자와 DB를 가리켜야 합니다. 설치 목록의 드라이버에 맞춰 `postgresql+psycopg://`를 사용합니다. Gemini 모델은 계정에서 호출 가능한 모델 ID로 지정합니다. 현재 코드에서는 Gemini 키가 없으면 서버 모듈 초기화가 중단됩니다.

Kakao 로그인은 [`app.json`](../app.json)의 네이티브 앱 키와 플랫폼별 설정을 본인의 앱 등록 정보에 맞춰 구성해야 합니다. `.env`에는 실제 키를 저장하며, 저장소에는 커밋하지 않습니다.

## 2. 백엔드 설치·실행

프로젝트 루트에서 다음 명령으로 Python 환경을 구성합니다. 명령은 macOS/Linux 기준입니다.

```bash
cd backend
python3 -m venv .venv
source .venv/bin/activate
python -m pip install -r requirements.txt
mkdir -p uploads/chat uploads/clothes
```

현재 [`requirements.txt`](../backend/requirements.txt)에는 코드가 사용하는 `torch`, `torchvision`, `numpy`, `ultralytics`, `APScheduler`, `feedparser`, `requests`, `google-genai`, `google-auth`, `cachetools`, `tenacity`가 빠져 있습니다. **위 설치 명령만으로는 서버를 실행할 수 없으며**, 고정된 기존 패키지와의 호환성을 확인해 추가 의존성을 설치해야 합니다. PostgreSQL 드라이버도 시스템의 `libpq` 또는 해당 버전의 `psycopg[binary]` 구성이 필요합니다.

의존성과 환경 변수를 준비한 뒤 DB 마이그레이션을 적용합니다.

```bash
alembic upgrade head
```

현재 마이그레이션에는 `laundry_baskets` 테이블 생성 이력이 포함되어 있지만, `clothing_activities` 테이블 생성 이력은 포함되어 있지 않습니다. 새 DB에서 착용 활동 관련 기능을 사용하려면 [`ORM 모델`](../backend/app/models)에 맞춘 추가 마이그레이션이 필요합니다.

모델 파일과 DB 준비를 마친 환경에서는 **`backend/` 디렉터리에서** 서버를 실행합니다.

```bash
uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
```

서버 실행 후 [상태 확인](http://localhost:8000/healthz)과 [Swagger API 문서](http://localhost:8000/docs)를 열 수 있습니다. `/healthz`는 서버 응답 여부를 확인하는 경로이며 DB·외부 API·전체 기능의 정상 동작까지 보장하지는 않습니다.

[`backend/scripts/start.sh`](../backend/scripts/start.sh)는 `/opt/rewear/backend` 경로를 전제로 하는 운영 스크립트입니다. 로컬 개발에는 위 실행 명령을 사용합니다.

## 3. 모바일 앱 실행

별도 터미널에서 프로젝트 루트로 이동한 뒤 원하는 플랫폼을 실행합니다.

```bash
# Android
npm run android

# iOS: macOS 및 Xcode 필요
npm run ios
```

Kakao 로그인 등 네이티브 모듈을 사용하므로 네이티브 빌드를 기준으로 실행합니다. 빌드 이후 개발 서버만 다시 시작할 때는 `npm start`를 사용합니다. `.env` 변경 내용이 반영되지 않으면 `npx expo start --clear`로 캐시를 초기화합니다.

## AI 모델과 API

| 입력 | 처리 | 사용자에게 제공하는 정보 |
| :--- | :--- | :--- |
| 케어라벨 사진 | YOLOv8 객체 감지 → Gemini 설명 생성 | 인식 기호·위치·신뢰도, 단계별 세탁 가이드 |
| 의류 사진 | EfficientNet-B0 멀티라벨 분류 → 소재 후보 선택 → 기본 세탁법·Gemini 설명 | 소재 후보와 확률, 의류별 관리 정보 |
| 직접 선택한 기호 | 선택한 케어라벨 정보 → 관리 설명 | 사진 인식 없이 확인하는 세탁법 |

소재 모델은 13개 클래스와 클래스별 임계값을 사용하며 상위 5개 후보를 반환합니다. 케어라벨 모델의 학습 클래스는 발표 자료 기준 21개입니다. 소재 학습에는 발표 자료에 명시된 AI Hub 의류 이미지 데이터를 활용했습니다.

### 모델 파일과 실제 추론 API

| 파일 | 역할 |
| :--- | :--- |
| [`best_ml.pt`](../backend/app/models/best_ml.pt) | EfficientNet-B0 소재 분류 가중치 |
| [`vocab_multilabel.json`](../backend/app/models/vocab_multilabel.json) | 13개 소재 클래스 목록 |
| [`thresholds_per_class_v3.json`](../backend/app/models/thresholds_per_class_v3.json) | 소재 클래스별 판정 임계값 |
| [`best.pt`](../backend/app/models/best.pt) | YOLOv8 케어라벨 감지 가중치 |

- `POST /laundry/scan`: 케어라벨 이미지 감지
- `POST /laundry/explain`: 감지한 기호를 바탕으로 Gemini 가이드 생성
- `POST /v1/infer/material`: 의류 이미지의 소재 분석
- `POST /clothes/add`: 옷 등록과 소재 분석
- `POST /clothes/{cid}/care-summary`: 등록한 의류의 관리 가이드 생성

`/infer/label`, `/infer/material` 등에는 임시 응답을 반환하는 코드가 남아 있습니다. 실제 모델을 확인할 때는 위 경로를 사용합니다. AI 분석 결과는 추정치이므로 의류에 부착된 실제 케어라벨을 함께 확인해야 합니다.

## 프로젝트 구조

```text
Re-wear-project/
├── app/                       # Expo Router 화면
│   ├── (tabs)/                # 홈·옷장·순환·캘린더·나의 숲
│   ├── carelabel/             # 세탁 기호 직접 선택과 설명
│   ├── community/             # 라운지·게시글·사용자 프로필
│   ├── chat/                  # 1:1 채팅
│   ├── scan.js                # 케어라벨 촬영·업로드
│   └── scanResult.js          # 인식 결과와 세탁 가이드
├── assets/                    # 아이콘·세탁 기호·애니메이션·수거함 CSV
├── components/                # 공통 UI 컴포넌트
├── context/                   # 테마 컨텍스트
├── backend/
│   ├── app/
│   │   ├── routers/           # 기능별 API
│   │   ├── services/          # AI 추론·관리 가이드·알림 로직
│   │   ├── models/            # ORM 모델과 AI 가중치
│   │   ├── schemas/           # 요청·응답 스키마
│   │   └── main.py            # FastAPI 진입점
│   ├── alembic/               # DB 마이그레이션
│   ├── scripts/               # 서버 운영 스크립트
│   └── requirements.txt       # Python 의존성 목록
└── docs/                      # 개발 가이드·README 참고 기록·화면 이미지
```

---

[← Re:wear 소개로 돌아가기](../README.md)
