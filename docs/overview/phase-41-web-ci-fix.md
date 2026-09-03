# Phase 41: Web CI API 작업 디렉터리 수정

## 문제

GitHub Actions의 Web CI(commit `ad7b120`)가 "API 의존성 설치" 단계에서 실패했습니다.

- 로컬 `npm ci`(api)는 정상 성공
- CI 로그: `working-directory: api`가 job 기본값(`web`)과 충돌해 올바른 경로로 해석되지 않음

## 수정

`working-directory` step 속성 대신 `npm --prefix ../api` 명령 방식으로 변경하여, job 기본 작업 디렉터리와 무관하게 동작하도록 했습니다.

- API 의존성 설치: `npm --prefix ../api ci`
- API 빌드: `npm --prefix ../api run build`
- API 기동: `npm --prefix ../api run start`

## 검증

- 로컬 재현: `npm ci`(api) 성공 확인
- 원격 재실행: 푸시 후 Web CI 재실행으로 확인 예정

## 커밋

`3b96762` — Fix web CI API working directory resolution
