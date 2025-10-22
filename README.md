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

flowchart LR
  %% =======================================================
  %%                  ReWear System Architecture
  %% =======================================================

  %% ====================== APP ============================
  subgraph APP["📱 React Native (Expo) 앱"]
    direction TB
    A1["• 홈 / 옷장 / 캘린더 / 프로필 화면"]
    A2["• 카카오 로그인, 사용자 세션 저장 (AsyncStorage)"]
    A3["• axios로 FastAPI 서버와 통신 (JWT 인증)"]
  end


  %% ====================== API ============================
  subgraph API["🔗 FastAPI 백엔드"]
    direction TB
    ROU["📦 주요 라우터 - 인증 / 사용자 / 의류 / 이벤트 / 추론 / 뉴스"]
    ST["⚙️ 초기화 단계 - DB 마이그레이션, AI 모델 로드, 스케줄러 시작"]
    STC["🖼️ 정적 파일 서빙 - 업로드된 이미지 제공"]
  end


  %% ====================== DATABASE ========================
  subgraph DB["🗄️ 데이터베이스 (PostgreSQL)"]
    direction TB
    DBM["• SQLAlchemy ORM으로 관리 
    • 테이블: 사용자, 의류, 이벤트, 활동 로그"]
  end


  %% ====================== ML SERVICE ======================
  subgraph ML["🤖 AI Inference 서비스"]
    direction TB
    MLN["• EfficientNet 모델로 소재 분류.
    • 세탁 가이드 규칙 생성 
    • 라벨 추론 기능 포함"]
  end


  %% ====================== STORAGE =========================
  subgraph FS["🖼️ 이미지 저장소"]
    direction TB
    FSD["• 사용자가 업로드한 옷 이미지 저장
    • 앱에서 재사용 및 미리보기 제공"]
  end


  %% ====================== SCHEDULER =======================
  subgraph SCH["⏰ 스케줄러 (APScheduler)"]
    direction TB
    SCH6["• 6시간마다 뉴스 캐시 갱신
    • FastAPI 내부에서 비동기로 실행"]
  end


  %% ====================== NEWS ============================
  subgraph NEWS["📰 뉴스 서비스"]
    direction TB
    N1["• Google 뉴스 RSS 수집
    • 최신 패션·환경 관련 기사 캐시 제공"]
  end


  %% ====================== FLOWS ===========================
  APP -->|"REST API 요청 (JSON + JWT)"| API
  API -. "데이터 CRUD" .-> DB
  API -. "이미지 저장 / 제공" .-> FS
  API -. "AI 추론 / 세탁 가이드" .-> ML
  API -->|"뉴스 캐시 제공"| NEWS
  SCH -->|"주기적 뉴스 갱신"| API