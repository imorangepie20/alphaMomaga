# Phase 38: Properties API 브라우저 통합 검증

## 목표
실제 프론트엔드 `web/`의 Properties 페이지가 fallback fixture가 아니라 API 응답을 렌더링하는지 검증합니다.

## 검증 범위

- `GET /properties` API 응답 성공
- API 응답의 자산 수와 화면 요약 수 일치
- API 응답의 모든 매물명이 `/properties` 화면에 표시
- 관리자 UI 로컬 포트 `3001` 기준 동작
- API 로컬 origin `3100` 기준 동작

## 실행 전제

API가 `http://localhost:3100`에서 실행 중이어야 합니다. 다른 API origin을 사용할 경우 `API_URL`을 지정합니다.

```powershell
cd C:\Users\jowoo\alpahMomega\web
$env:API_URL = 'http://localhost:3100'
npm.cmd run test:e2e -- e2e/properties-api.spec.ts --workers=1
```

Cloudflare staging 검증:

```powershell
$env:PLAYWRIGHT_BASE_URL = 'https://mnre.approid.team'
$env:API_URL = 'https://api.approid.team'
npm.cmd run test:e2e -- e2e/properties-api.spec.ts --workers=1
```

## CI 정책

현재 `web` CI는 독립적으로 실행되는 lint/build와 fixture 기반 운영 화면 테스트를 수행합니다. API 서비스가 필요한 이 테스트는 API 서비스 컨테이너 또는 staging 자격 조건을 CI에 추가한 뒤 편입합니다.

## 결과

- Properties API 브라우저 통합 테스트: **1개 통과**
- `SDTPL_ADM/`은 변경하지 않음
