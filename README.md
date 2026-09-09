<div align="center">

<img src="docs/images/rewear-banner.png" alt="Re:wear — 세탁 라벨 인식과 착용·세탁 기록으로 옷을 관리하고 리폼·업사이클링까지 연결하는 플랫폼. 옷장과 캘린더 앱 화면." width="100%" />

<br />

# Re:wear

**내 옷을 이해하고, 오래 입고, 다시 순환시키다.**

AI 의류 분석부터 착용·세탁 기록, 리폼과 나눔까지 연결하는<br />
슬로우패션 기반 지속가능 옷 관리 플랫폼

<br />

![React Native](https://img.shields.io/badge/React_Native-0.81-20232A?logo=react&logoColor=61DAFB)
![Expo](https://img.shields.io/badge/Expo-54-000020?logo=expo&logoColor=white)
![FastAPI](https://img.shields.io/badge/FastAPI-009688?logo=fastapi&logoColor=white)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-4169E1?logo=postgresql&logoColor=white)
![PyTorch](https://img.shields.io/badge/PyTorch-EE4C2C?logo=pytorch&logoColor=white)

**전공종합설계 PBL · G팀 홍태호패션연구소**

[프로젝트 소개](#프로젝트-소개) · [주요 화면](#주요-화면) · [핵심 기능](#핵심-기능) · [기술 구조](#기술-구조) · [개발 환경](#개발-환경) · [팀 소개](#팀-소개)

</div>

## 프로젝트 소개

“세탁 기호는 어렵고, 소재마다 관리법은 다르고, 안 입는 옷을 어떻게 활용할지도 모르겠어요.”

Re:wear는 일상에서 옷을 관리할 때 마주치는 질문에서 출발했습니다. 옷과 케어라벨 사진을 분석해 관리 방법을 안내하고, 착용·세탁 기록을 바탕으로 다음 세탁 시점을 살펴볼 수 있게 합니다. 더 이상 입지 않는 옷은 리폼 콘텐츠, 커뮤니티, 헌옷수거함 지도를 통해 새로운 쓰임으로 연결합니다.

| 알아보기 | 관리하기 | 순환하기 |
| :--- | :--- | :--- |
| 소재와 세탁 기호를 분석해 내 옷에 맞는 관리법 확인 | 옷장에 등록하고 착용·세탁 이력과 세탁 필요 알림 확인 | 리폼 아이디어 탐색, 커뮤니티 소통, 수거함 위치 확인 |

작은 실천을 이어갈 수 있도록 일일 미션과 **리웨어 빌리지**도 함께 제공합니다. 옷을 오래 입는 습관이 나만의 숲을 가꾸는 즐거움으로 이어지도록 설계했습니다.

## 주요 화면

<table>
  <tr>
    <th align="center">홈 · 케어라벨 검색</th>
    <th align="center">나의 옷장</th>
    <th align="center">리웨어 라운지</th>
  </tr>
  <tr>
    <td align="center"><img src="docs/images/home.png" alt="세탁 알림, 케어라벨 검색, 주간 캘린더를 보여주는 홈 화면" width="230" /></td>
    <td align="center"><img src="docs/images/closet.png" alt="카테고리별로 등록한 옷을 보여주는 옷장 화면" width="230" /></td>
    <td align="center"><img src="docs/images/lounge.png" alt="의류 사진과 게시글, 좋아요 및 댓글을 보여주는 커뮤니티 화면" width="230" /></td>
  </tr>
  <tr>
    <td align="center">오늘 필요한 옷 관리 한눈에 보기</td>
    <td align="center">가진 옷을 카테고리별로 관리</td>
    <td align="center">의류와 재활용 아이디어 공유</td>
  </tr>
</table>

<sub>전공종합설계 PBL 중간 발표 PDF의 14·17·24쪽에서 추출한 화면입니다. 현재 개발 화면과 일부 차이가 있을 수 있습니다.</sub>

## 핵심 기능

### 1. 사진으로 알아보는 의류 관리법

- **케어라벨 인식**: 라벨 사진에서 YOLOv8이 세탁 기호와 위치를 감지하고, Gemini가 세탁·건조·다림질 방법과 주의사항을 설명합니다.
- **기호 직접 선택**: 라벨이 흐리거나 인식 결과가 불완전할 때는 사용자가 기호를 직접 선택해 설명을 확인할 수 있습니다.
- **의류 소재·카테고리 분석**: 옷 사진을 등록하면 EfficientNet-B0 기반 멀티태스크 모델이 소재 후보와 카테고리를 함께 분석하고, 소재별 기본 세탁법과 Gemini 기반 관리 가이드를 제공합니다.

### 2. 기록으로 이어지는 옷장 관리

- **디지털 옷장**: 사진·이름·카테고리로 옷을 등록하고, 소재와 관리 정보를 함께 확인합니다. 사용자 정의 카테고리도 추가할 수 있습니다.
- **착용·세탁 캘린더**: 날짜별 활동을 기록하고 달력의 표시로 의류 사용 이력을 살펴봅니다.
- **세탁 필요 알림과 빨래통**: 마지막 세탁 이후의 착용 기록과 소재·카테고리별 기준을 활용해 세탁이 필요한 옷을 안내하고, 빨래통에 추가하는 흐름을 제공합니다.

### 3. 다시 입고, 나누고, 순환하기

- **리폼·업사이클링 탐색**: `셔츠` 또는 `셔츠 치마`처럼 검색하면 YouTube에서 관련 리폼 영상을 찾아볼 수 있습니다.
- **리웨어 라운지**: 여러 장의 사진을 담은 게시글, 좋아요, 댓글로 리폼 경험과 중고 의류 정보를 공유합니다. 게시글·프로필과 연결된 **WebSocket 기반 1:1 채팅**으로 대화를 이어갑니다.
- **헌옷수거함 지도**: 현재 위치와 CSV 데이터를 활용해 수거함 위치를 표시합니다. 저장소에는 **서울 구로구·양천구** 데이터가 포함되어 있습니다.
- **지속가능 패션 콘텐츠**: 패션·환경 관련 RSS 뉴스와 슬로우패션 브랜드 정보를 탐색하고 관심 브랜드를 저장합니다.

### 4. 실천을 쌓아 만드는 리웨어 빌리지

로그인, 옷 등록, 착용·세탁 기록, 뉴스 확인 등의 일일 미션으로 포인트를 모읍니다. 모은 포인트로 동물과 오브젝트를 구매하고 나만의 숲을 꾸밀 수 있습니다. Lottie 애니메이션과 낮·밤 표현을 더해 반복적인 기록 활동에 즐거움을 담았습니다.

## 기술 구조

### 기술 스택

| 구분 | 기술 | 용도 |
| :--- | :--- | :--- |
| 모바일 앱 | React Native 0.81, Expo SDK 54, Expo Router | iOS·Android 화면과 파일 기반 라우팅 |
| 언어·클라이언트 | JavaScript 중심, 일부 TypeScript, Axios, AsyncStorage | API 통신과 로그인 정보 저장 |
| 화면 기능 | React Native Maps, Expo Location, React Native Calendars, Lottie | 수거함 지도, 활동 달력, 빌리지 애니메이션 |
| 백엔드 | FastAPI, Uvicorn, SQLAlchemy, Alembic | API, 데이터 접근, DB 마이그레이션 |
| 데이터 저장 | PostgreSQL, 서버의 `uploads/` 디렉터리 | 사용자·의류·활동·커뮤니티 데이터와 업로드 파일 |
| AI | PyTorch, Torchvision, EfficientNet-B0, Ultralytics YOLOv8, Gemini API | 소재 분류, 케어라벨 감지, 관리 가이드 생성 |
| 인증·실시간 통신 | JWT, Kakao Login, WebSocket | 로그인과 1:1 채팅 |
| 콘텐츠 연동 | YouTube Data API, Google News RSS, APScheduler | 리폼 영상 검색과 주기적인 뉴스 갱신 |

### 시스템 구성

```mermaid
flowchart LR
    App["Re:wear 모바일 앱<br/>React Native · Expo"]
    API["FastAPI<br/>인증 · 옷장 · 기록 · 커뮤니티 · 빌리지"]
    DB[("PostgreSQL")]
    Files["업로드 이미지<br/>uploads/"]
    ML["이미지 분석<br/>EfficientNet-B0 · YOLOv8"]
    Gemini["Gemini API<br/>세탁·관리 가이드"]
    Content["외부 콘텐츠<br/>YouTube · Google News RSS"]
    CSV["지역 수거함 CSV<br/>위치 기반 지도"]

    App <-->|"REST API · WebSocket"| API
    API <--> DB
    API <--> Files
    API --> ML
    API <-->|"분석 결과 · 관리 설명"| Gemini
    API <--> Content
    CSV --> App
```

이미지 추론은 서버에서 수행합니다. 뉴스는 서버 시작 시와 이후 6시간 간격으로 갱신해 캐시하며, 수거함 지도는 앱에 포함된 지역별 CSV를 사용합니다.

### AI 처리 흐름

| 입력 | 처리 | 사용자에게 제공하는 정보 |
| :--- | :--- | :--- |
| 케어라벨 사진 | YOLOv8 객체 감지 → Gemini 설명 생성 | 인식 기호·위치·신뢰도, 단계별 세탁 가이드 |
| 의류 사진 | EfficientNet-B0 멀티태스크 분류 → 소재·카테고리 선택 → 기본 세탁법·Gemini 설명 | 소재 후보와 확률, 카테고리, 의류별 관리 정보 |
| 직접 선택한 기호 | 선택한 케어라벨 정보 → 관리 설명 | 사진 인식 없이 확인하는 세탁법 |

현재 모델은 소재 8종과 의류 카테고리 12종을 함께 분류합니다. 소재는 임계값 0.5로 상위 5개 후보를 반환하고, 카테고리는 가장 높은 확률의 유형을 스웨터·코트 등 12개 한글 이름으로 저장하고 옷장에 표시합니다. [모델 설정과 검증](docs/category-classification.md)을 참고하세요. 케어라벨 모델의 학습 클래스는 발표 자료 기준 21개입니다. 소재 학습에는 발표 자료에 명시된 AI Hub 의류 이미지 데이터를 활용했습니다.

<details>
<summary>모델 파일과 실제 추론 API</summary>

| 파일 | 역할 |
| :--- | :--- |
| [`best_multitask.pt`](backend/app/models/best_multitask.pt) | 현재 소재 8종·카테고리 12종 분류 가중치 |
| [`multitask_config.json`](backend/app/models/multitask_config.json) | 새 모델의 라벨 순서·카테고리 매핑·임계값·체크섬 |
| [`best_ml.pt`](backend/app/models/best_ml.pt) | 이전 소재 전용 모델 (복구용) |
| [`vocab_multilabel.json`](backend/app/models/vocab_multilabel.json) | 이전 모델용 소재 사전 파일 (체크포인트 내 vocab 우선) |
| [`thresholds_per_class_v3.json`](backend/app/models/thresholds_per_class_v3.json) | 이전 소재 모델용 클래스별 판정 임계값 |
| [`best.pt`](backend/app/models/best.pt) | YOLOv8 케어라벨 감지 가중치 |

- `POST /laundry/scan`: 케어라벨 이미지 감지
- `POST /laundry/explain`: 감지한 기호를 바탕으로 Gemini 가이드 생성
- `POST /v1/infer/material`: 의류 이미지의 소재·카테고리 분석
- `POST /clothes/add`: 옷 등록과 소재·카테고리 분석
- `POST /clothes/{cid}/care-summary`: 등록한 의류의 관리 가이드 생성

`/infer/label`, `/infer/material` 등에는 임시 응답을 반환하는 코드가 남아 있습니다. 실제 모델을 확인할 때는 위 경로를 사용합니다. AI 분석 결과는 추정치이므로 의류에 부착된 실제 케어라벨을 함께 확인해야 합니다.

</details>

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
└── docs/images/               # README 화면 이미지
```

## 개발 환경

모바일 앱과 FastAPI 서버를 각각 실행하는 구조입니다. 

<details>
<summary>사전 준비와 환경 변수</summary>

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

Kakao 로그인은 [`app.json`](app.json)의 네이티브 앱 키와 플랫폼별 설정을 본인의 앱 등록 정보에 맞춰 구성해야 합니다. `.env`에는 실제 키를 저장하며, 저장소에는 커밋하지 않습니다.

</details>

<details>
<summary>백엔드 설치·실행과 현재 보완 사항</summary>

프로젝트 루트에서 다음 명령으로 Python 환경을 구성합니다. 명령은 macOS/Linux 기준입니다.

```bash
cd backend
python3 -m venv .venv
source .venv/bin/activate
python -m pip install -r requirements.txt
mkdir -p uploads/chat uploads/clothes
```

현재 [`requirements.txt`](backend/requirements.txt)에는 코드가 사용하는 `torch`, `torchvision`, `numpy`, `ultralytics`, `APScheduler`, `feedparser`, `requests`, `google-genai`, `google-auth`, `cachetools`, `tenacity`가 빠져 있습니다. **위 설치 명령만으로는 서버를 실행할 수 없으며**, 고정된 기존 패키지와의 호환성을 확인해 추가 의존성을 설치해야 합니다. PostgreSQL 드라이버도 시스템의 `libpq` 또는 해당 버전의 `psycopg[binary]` 구성이 필요합니다.

의존성과 환경 변수를 준비한 뒤 DB 마이그레이션을 적용합니다.

```bash
alembic upgrade head
```

현재 마이그레이션에는 `laundry_baskets` 테이블 생성 이력이 포함되어 있지만, `clothing_activities` 테이블 생성 이력은 포함되어 있지 않습니다. 새 DB에서 착용 활동 관련 기능을 사용하려면 [`ORM 모델`](backend/app/models)에 맞춘 추가 마이그레이션이 필요합니다.

모델 파일과 DB 준비를 마친 환경에서는 **`backend/` 디렉터리에서** 서버를 실행합니다.

```bash
uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
```

서버 실행 후 [상태 확인](http://localhost:8000/healthz)과 [Swagger API 문서](http://localhost:8000/docs)를 열 수 있습니다. `/healthz`는 서버 응답 여부를 확인하는 경로이며 DB·외부 API·전체 기능의 정상 동작까지 보장하지는 않습니다.

[`backend/scripts/start.sh`](backend/scripts/start.sh)는 `/opt/rewear/backend` 경로를 전제로 하는 운영 스크립트입니다. 로컬 개발에는 위 실행 명령을 사용합니다.

</details>

<details>
<summary>모바일 앱 실행</summary>

별도 터미널에서 프로젝트 루트로 이동한 뒤 원하는 플랫폼을 실행합니다.

```bash
# Android
npm run android

# iOS: macOS 및 Xcode 필요
npm run ios
```

Kakao 로그인 등 네이티브 모듈을 사용하므로 네이티브 빌드를 기준으로 실행합니다. 빌드 이후 개발 서버만 다시 시작할 때는 `npm start`를 사용합니다. `.env` 변경 내용이 반영되지 않으면 `npx expo start --clear`로 캐시를 초기화합니다.

</details>



## 팀 소개

**G팀 · 홍태호패션연구소**

| 이름 | 구분 |
| :--- | :--- |
| [홍주성](https://github.com/juuu-sung) | 팀장 |
| 김재호 | 팀원 |
| 한태희 | 팀원 |

