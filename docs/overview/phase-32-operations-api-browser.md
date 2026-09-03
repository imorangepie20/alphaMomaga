# Phase 32: 운영 페이지 API 브라우저 연동 검증

## 목표
Cloudflare 관리자 UI의 운영 페이지들이 공개 API 응답을 실제로 렌더링하는지 검증합니다.

## 검증 범위

- `/tenants`: 임차인 이름과 임차료
- `/contracts`: 계약 종료일과 월 임차료
- `/payments`: 수납 금액과 납부 예정일
- `/maintenance`: 작업 내용과 예정일
- `/inspections`: 점검 유형과 예정일

각 테스트는 `GET https://api.approid.team/...`에서 첫 레코드를 읽은 뒤, `https://mnre.approid.team`의 해당 페이지에 같은 값이 표시되는지 확인합니다.

## 실행

```powershell
cd C:\Users\jowoo\alpahMomega\SDTPL_ADM
$env:PLAYWRIGHT_BASE_URL = 'https://mnre.approid.team'
$env:API_URL = 'https://api.approid.team'
npm.cmd run test:e2e -- e2e/operations-api.spec.ts
```

## 결과

- 운영 페이지 브라우저 테스트: **5개 통과**
- 검증 대상: tenants, contracts, payments, maintenance, inspections
- Cloudflare 관리자 UI 및 공개 API 응답 정상 확인
