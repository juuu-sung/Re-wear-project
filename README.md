# Welcome to your Expo app 👋

This is an [Expo](https://expo.dev) project created with [`create-expo-app`](https://www.npmjs.com/package/create-expo-app).

## Get started

1. Install dependencies

   ```bash
   npm install
   ```

2. Start the app

   ```bash
   npx expo start
   ```

In the output, you'll find options to open the app in a

- [development build](https://docs.expo.dev/develop/development-builds/introduction/)
- [Android emulator](https://docs.expo.dev/workflow/android-studio-emulator/)
- [iOS simulator](https://docs.expo.dev/workflow/ios-simulator/)
- [Expo Go](https://expo.dev/go), a limited sandbox for trying out app development with Expo

You can start developing by editing the files inside the **app** directory. This project uses [file-based routing](https://docs.expo.dev/router/introduction).

## Get a fresh project

When you're ready, run:

```bash
npm run reset-project
```

This command will move the starter code to the **app-example** directory and create a blank **app** directory where you can start developing.

## Learn more

To learn more about developing your project with Expo, look at the following resources:

- [Expo documentation](https://docs.expo.dev/): Learn fundamentals, or go into advanced topics with our [guides](https://docs.expo.dev/guides).
- [Learn Expo tutorial](https://docs.expo.dev/tutorial/introduction/): Follow a step-by-step tutorial where you'll create a project that runs on Android, iOS, and the web.

## Join the community

Join our community of developers creating universal apps.

- [Expo on GitHub](https://github.com/expo/expo): View our open source platform and contribute.
- [Discord community](https://chat.expo.dev): Chat with Expo users and ask questions.

```mermaid
flowchart LR
  %% ===================== ReWear Architecture =====================

  %% ---------- App ----------
  subgraph APP["React Native (Expo) App"]
    direction TB
    A1["홈, 옷장, 캘린더, 프로필 화면"]
    A2["Kakao Login, AsyncStorage(JWT)"]
    A3["Axios로 FastAPI 통신"]
  end

  %% ---------- API ----------
  subgraph API["FastAPI Backend"]
    direction TB
    R1["라우터: auth, user, clothes, event, infer, news"]
    R2["초기화: Alembic, 모델 로드, 스케줄러 시작"]
    R3["정적 파일 서빙 (/uploads)"]
  end

  %% ---------- DB ----------
  subgraph DB["Database (PostgreSQL)"]
    direction TB
    D1["SQLAlchemy ORM 관리"]
    D2["테이블: 사용자, 의류, 이벤트, 활동 로그"]
  end

  %% ---------- ML ----------
  subgraph ML["AI Inference Service"]
    direction TB
    M1["EfficientNet 기반 소재 분류"]
    M2["세탁 가이드 규칙 생성"]
    M3["라벨 추론 기능 포함"]
  end

  %% ---------- FS ----------
  subgraph FS["Image Storage"]
    direction TB
    F1["업로드 이미지 저장 및 제공"]
    F2["앱 미리보기 및 재사용"]
  end

  %% ---------- Scheduler ----------
  subgraph SCH["Scheduler (APScheduler)"]
    direction TB
    S1["6시간마다 뉴스 캐시 갱신"]
    S2["FastAPI 내부 비동기 실행"]
  end

  %% ---------- News ----------
  subgraph NEWS["News Service"]
    direction TB
    N1["Google RSS 수집"]
    N2["패션/환경 뉴스 캐시 제공"]
  end

  %% ---------- Flows ----------
  APP -->|"REST API 요청 (JSON + JWT)"| API
  API -->|"데이터 CRUD"| DB
  API -->|"이미지 저장 / 제공"| FS
  API -->|"AI 추론 / 세탁 가이드"| ML
  API -->|"뉴스 캐시 제공"| NEWS
  SCH -->|"주기적 뉴스 갱신"| API
```
