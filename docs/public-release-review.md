# GitHub 공개 전 재검토 — 2026-09-10

**판정: 아직 PRIVATE 유지.** 코드 정리와 Git 이력 정리를 진행 중이며 공개 설정은 변경하지 않습니다. 비밀값과 사용자 미디어는 이 문서에 기록하지 않습니다.

## 완료한 코드 정리

- DB 접속정보를 `backend/app/core/config.py`에서 환경변수로만 읽도록 통합했습니다. 비밀번호가 들어 있는 기본 접속 문자열을 제거했습니다.
- JWT 기본키를 제거하고 키 누락 또는 짧은 키를 거부합니다. 로컬에서 사용하던 약한 키를 교체했습니다. 서버 재시작 후 기존 앱 로그인은 다시 해야 합니다.
- 로그인 화면에서 토큰·서버 응답·사용자 정보를 출력하던 로그를 제거했습니다.
- Alembic에 자격증명을 직접 기록하지 않고 중앙 설정을 전달합니다. URL 인코딩된 비밀번호가 `%` 보간 오류를 일으키지 않도록 URL을 직접 사용합니다.
- 환경파일 예시와 비밀 설정 검사 테스트를 추가했습니다.
- 업로드 사진·영상, 모델 가중치 3개, macOS 시스템 파일을 Git 추적에서 제외했습니다. 로컬 원본은 보존했습니다. 업로드 ignore 경로도 수정했습니다.

## 이력 정리 계획과 검증

기존 모든 참조의 복구용 bundle은 Git에서 제외된 `.local-backups/public-release-20260910/`에 보관합니다. 원격의 최신 참조를 별도 mirror로 복제하고 환경파일·업로드·가중치·가상환경·시스템 파일 및 하드코딩된 DB 자격증명을 제거한 뒤 검사합니다. 원격 갱신 시 각 브랜치의 이전 SHA를 검사해 다른 작업이 추가되었으면 중단합니다. 정리 후 커밋 SHA가 달라지므로 팀원은 기존 로컬 브랜치를 다시 push하지 말고 새로 clone해야 합니다.

현재까지 백엔드 단위 테스트 31건, 변경 로그인 화면 린트, 중앙 설정을 이용한 실제 DB 접속 및 기존 기본 JWT 키 토큰 거부를 확인했습니다. 이력 재작성 및 원격 재검사 결과는 후속 보고서에 기록합니다.

## 공개를 보류하는 항목

1. GitHub의 과거 PR 참조와 캐시에는 이력 재작성 후에도 예전 파일이 남을 수 있습니다. 해당 참조의 제거 가능 여부와 GitHub Support 후속 처리가 필요합니다. 원격 브랜치의 정리와 서버에서 과거 객체를 완전히 제거하는 것은 다릅니다.
2. 모델·학습 데이터·앱 자산의 재배포 권한과 팀 코드 공개 동의가 확인되지 않았습니다. 모델 가중치는 제외했지만 Ultralytics 관련 서비스 코드의 라이선스 판단까지 끝났다는 뜻은 아닙니다.
3. 앱 자산은 `docs/asset-rights-inventory.csv`에 목록화했으며 출처·라이선스는 미확인 상태입니다. 공개 전 증빙을 채우거나 허가된 대체 자산으로 교체해야 합니다. 상세 목록은 `docs/assets-publication.md`를 참고하세요.
4. 과거 DB 자격증명을 다른 DB나 서비스에서도 재사용했다면 해당 서비스도 변경해야 합니다. 이번에 확인한 것은 Mac 로컬 DB뿐입니다.

이번 이력 검사에는 2MB 미만 UTF-8 파일 패턴 검사와 민감 경로 확인을 사용합니다. 바이너리 전체 내용, 모든 외부 첨부 대상 및 비밀값의 실제 유효성을 전수 확인하지 않으므로 비밀값 부재를 보증하지 않습니다.

참고: [GitHub 민감 데이터 제거 안내](https://docs.github.com/en/authentication/keeping-your-account-and-data-secure/removing-sensitive-data-from-a-repository), [공개 범위 변경 안내](https://docs.github.com/en/repositories/managing-your-repositorys-settings-and-features/managing-repository-settings/setting-repository-visibility), [Ultralytics 라이선스 안내](https://www.ultralytics.com/license).
