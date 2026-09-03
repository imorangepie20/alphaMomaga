# Phase 31: 매물 API 브라우저 연동 검증

## 목표
Cloudflare 관리자 UI의 운영 페이지가 공개 API에서 반환한 매물 데이터를 렌더링하는지 브라우저에서 검증합니다.

## 변경 사항

- `web/playwright.config.ts`의 `PLAYWRIGHT_BASE_URL`로 Cloudflare UI를 직접 테스트합니다.
- `web/e2e/properties-api.spec.ts`를 추가했습니다.
- 테스트는 API의 `/properties` 응답을 읽고, UI의 `/properties` 페이지에서 자산 수와 모든 매물명이 표시되는지 확인합니다.

## 실행

```powershell
cd C:\Users\jowoo\alpahMomega\web
$env:PLAYWRIGHT_BASE_URL = 'https://mnre.approid.team'
$env:API_URL = 'https://api.approid.team'
npm.cmd run test:e2e -- e2e/properties-api.spec.ts
```

`PLAYWRIGHT_BASE_URL`이 설정되면 로컬 Next.js 서버를 시작하지 않습니다. `API_URL`은 비교 대상 API 주소입니다.

## 결과

- Cloudflare 관리자 UI와 API 데이터 연동 테스트: 1개 통과
- 공개 API 응답: `GET https://api.approid.team/properties` 성공
