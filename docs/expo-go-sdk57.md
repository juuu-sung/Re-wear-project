# Expo Go SDK 57 실행과 복구

## 브랜치와 백업

- SDK 54 복구용 브랜치: `feature/sdk54-before-expo-upgrade` (`decbf8c0`)
- SDK 57 작업 브랜치: `feature/expo-sdk57-upgrade`
- `main`에는 이번 업그레이드를 병합하지 않았습니다.
- `.local-backups/expo-sdk54-before-upgrade/`에 기존 환경파일, 패키지 잠금파일, 앱 설정과 iOS/Android 원본 설정을 저장했습니다. 이 폴더는 Git에서 제외됩니다. Pods와 빌드 산출물은 복사하지 않았습니다.
- 기존 iOS/Android 폴더는 SDK 54 상태로 보존했습니다. Expo Go 실행에는 이 폴더의 재생성이 필요하지 않습니다.

## 휴대폰에서 실행

1. Mac과 휴대폰을 같은 Wi-Fi에 연결합니다.
2. 최상위 `.env`의 `EXPO_PUBLIC_BASE_URL`을 `http://<Mac의 Wi-Fi IP>:8000`으로 설정합니다. 휴대폰에서 `localhost`는 휴대폰 자신을 뜻합니다.
3. 기존 Python 가상환경으로 백엔드를 `0.0.0.0:8000`에서 실행합니다. 이미 실행 중이면 중복 실행하지 않습니다.
4. 프로젝트 최상위 폴더에서 아래 명령을 실행한 뒤, SDK 57용 Expo Go로 터미널 QR을 스캔합니다.

```bash
npm run start:go -- --port 8082
```

일반 로그인으로 테스트합니다. 카카오 로그인 코드와 네이티브 설정은 유지하지만 Expo Go에는 카카오 네이티브 모듈이 없으므로 해당 버튼의 실제 로그인은 지원하지 않습니다. 현재 설치된 카카오 라이브러리는 함수를 호출할 때 네이티브 모듈을 사용합니다.

## 업그레이드 변경

- SDK 54 → 55 → 56 → 57 순서로 패키지와 잠금파일을 갱신했습니다.
- 채팅 영상 재생을 Expo Go에서 제거된 `expo-av` 대신 `expo-video`로 변경했습니다. 미리보기를 닫으면 플레이어도 정리됩니다.
- 홈/캘린더/탭 컴포넌트의 React Navigation import를 Expo Router 진입점으로 변경했습니다.
- 기존 갤러리 API는 `expo-media-library/legacy`로 명시했습니다.
- SVG 변환기를 Expo 전용 진입점과 수정 버전으로 갱신하고, Babel 프리셋 및 직접 사용하는 Expo 패키지를 명시했습니다.
- 시작 화면 설정을 `expo-splash-screen` 플러그인으로 옮겼습니다.
- 중복 Safe Area 모듈을 없애도록 캘린더를 갱신하고, 사용하지 않는 `react-native-photo-view-ex`와 직접 설치하면 안 되는 `expo-modules-autolinking`을 제거했습니다.
- 로컬 `.env`만 휴대폰에서 접근 가능한 Mac IP로 변경했습니다. 환경파일은 커밋하지 않습니다.

네이티브 앱을 다시 빌드하려면 SDK 57에 맞는 네이티브 프로젝트 갱신과 Xcode가 별도로 필요합니다. 현재 Mac의 Xcode는 26.1.1이며 SDK 56 이후 공식 최소 요구사항은 26.4입니다. 이번 작업의 실행 대상은 Expo Go입니다.

## SDK 54로 되돌리기

실행 중인 Metro를 먼저 종료합니다. 이후 새로 수정한 파일이 있으면 별도 커밋이나 백업으로 보관하고 실행합니다.

```bash
git switch feature/sdk54-before-expo-upgrade
npm ci
```

서버 주소까지 원복하려면 백업의 `.env`를 최상위 `.env`로 복사합니다. 백엔드 환경파일과 기존 네이티브 원본은 이번 업그레이드에서 수정하지 않았습니다.

SDK 54는 현재 휴대폰의 SDK 57용 Expo Go와 호환되지 않으므로, 되돌린 뒤에는 기존 시뮬레이터/네이티브 앱으로 테스트합니다. 시뮬레이터 Expo Go 버전도 변경했다면 SDK 54용으로 다시 맞춰야 합니다.

참고: [Expo 업그레이드 안내](https://docs.expo.dev/workflow/upgrading-expo-sdk-walkthrough/), [SDK 56의 Router 변경](https://docs.expo.dev/router/migrate/sdk-55-to-56/), [SDK 57 릴리스](https://expo.dev/changelog/sdk-57).

## 검증 결과 (2026-09-09)

- 최종 버전: Expo 57.0.21, React Native 0.86.3, React 19.2.3.
- Expo 패키지 버전 검사 통과, Expo Doctor 21/21 통과, npm 의존성 트리 검사 통과.
- SDK 55·56에서 각각 iOS 번들 생성 통과. SDK 57 최종 iOS·Android 번들 생성 통과.
- iPhone 16e / iOS 26.0 시뮬레이터의 Expo Go 57.0.9에서 로그인 화면을 확인했습니다. 카카오 모듈 import로 인한 시작 오류는 없었습니다.
- Mac IP의 백엔드 `/openapi.json`이 HTTP 200으로 응답했습니다. 실제 계정 로그인·휴대폰 사진 등록·채팅 영상 재생은 별도의 사용자 기기 확인이 필요합니다.
- 새 동영상 컴포넌트, 변경한 탭 컴포넌트·갤러리 훅·Metro 설정은 린트 오류가 없습니다. 홈·캘린더·채팅 화면에서는 새 React Hooks 린트 규칙의 오류 10개가 남습니다. SDK 54 복구 커밋의 동일 파일을 새 린터로 검사해 동일한 오류가 있음을 확인했습니다.
- 추가 웹 번들 검사는 기존 `react-native-image-viewing`의 웹 구현 부재로 실패했습니다. 웹 실행은 이번 Expo Go 검증 범위에 포함하지 않습니다.
- 앱 폴더 안의 기존 데이터 파일 6개는 Expo Router에서 기본 화면 export가 없다는 경고를 냅니다. 앱 시작은 확인했으나 해당 파일 구조 정리는 별도 작업입니다.
