# 수납 원장 검증 상태

## 2026-09-04 로컬 검증

- API 단위 테스트: `179 passed`
- 웹 단위 테스트: `49 passed`
- 수납·운영·임차인 PostgreSQL e2e: `11 passed`
- API production build: 통과
- 웹 production build: 통과
- 로컬 PostgreSQL migration 및 현재 청구월 ledger seed: 통과

## Cloudflare Auth0 검증

`web/e2e/billing-ledger.spec.ts`는 `PLAYWRIGHT_BASE_URL`과
`PLAYWRIGHT_AUTH_STORAGE_STATE`를 사용한다. 역할이 `PropertyManager`인 Auth0
로그인 세션 파일이 있을 때 Cloudflare 도메인에서 수납 원장을 검증한다.

현재 자동화 환경에는 제어 가능한 브라우저 또는 Auth0 세션 파일이 없어서 이
시나리오는 skip 상태다. 이는 코드 실패가 아니라 외부 인증 세션 미제공에 따른
검증 보류이며, 세션이 준비되면 아래 명령으로 실행한다.

```powershell
$env:PLAYWRIGHT_BASE_URL = 'https://mnre.approid.team'
$env:PLAYWRIGHT_AUTH_STORAGE_STATE = 'C:\safe-path\property-manager-session.json'
npm.cmd run test:e2e --prefix web -- e2e/billing-ledger.spec.ts
```

