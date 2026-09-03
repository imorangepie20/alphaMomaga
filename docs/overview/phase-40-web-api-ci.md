# Phase 40: Web API 연동 CI 검증

## 목표
`web` CI가 fallback fixture만 확인하지 않고, 실제 `api` 애플리케이션 응답을 사용하는지 검증합니다.

## CI 흐름

`.github/workflows/web-ci.yml`에서 다음 순서로 실행합니다.

1. `web` 의존성 설치, lint, build
2. `api` 의존성 설치 및 build
3. API를 `3100` 포트에서 기동
4. `GET /properties`로 API 준비 확인
5. Chromium 설치
6. Properties와 5개 운영 페이지의 API 비교 브라우저 테스트 실행

실행 테스트:

- `properties-dashboard.spec.ts`
- `properties-api.spec.ts`
- `operations-api.spec.ts`

## 로컬 검증

```powershell
cd C:\Users\jowoo\alpahMomega\web
$env:API_URL = 'http://localhost:3100'
npm.cmd run test:e2e -- e2e/properties-dashboard.spec.ts e2e/properties-api.spec.ts e2e/operations-api.spec.ts --workers=1
```

## 결과

- API 연동 브라우저 테스트: **7개 통과**
- 프론트엔드 포트: `3001`
- API 포트: `3100`
- `SDTPL_ADM/`은 변경하지 않음
