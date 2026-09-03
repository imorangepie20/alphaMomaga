# Phase 39: 운영 페이지 API 브라우저 통합 검증

## 목표
실제 프론트엔드 `web/`의 운영 페이지가 API 응답을 그대로 렌더링하는지 검증합니다.

## 검증 범위

- `/tenants`: 이름, 임차료
- `/contracts`: 호실, 월 임대료, 종료일
- `/payments`: 금액, 납부 예정일
- `/maintenance`: 작업 내용, 예정일
- `/inspections`: 점검 유형, 예정일

각 테스트는 API origin에서 첫 레코드를 조회한 뒤 해당 페이지에 같은 값이 표시되는지 확인합니다.

## 실행

API가 `http://localhost:3100`에서 실행 중이어야 합니다.

```powershell
cd C:\Users\jowoo\alpahMomega\web
$env:API_URL = 'http://localhost:3100'
npm.cmd run test:e2e -- e2e/operations-api.spec.ts --workers=1
```

다른 API를 사용할 경우 `API_URL`을 변경합니다. Cloudflare staging에서는 `API_URL=https://api.approid.team`, `PLAYWRIGHT_BASE_URL=https://mnre.approid.team`을 사용합니다.

## 결과

- 운영 페이지 API 브라우저 테스트: **5개 통과**
- 관리자 포트: `3001`
- API 포트: `3100`
- 테마 참고용 `SDTPL_ADM/`은 변경하지 않음
