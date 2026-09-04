# 62단계: 수납 영속화 완료

## 변경 이유

수납 원장 기능과 PostgreSQL migration은 구현되어 있었지만, Tunnel API의 `api/.env`에
`DATABASE_URL`이 없어 실행 중인 API가 메모리 repository를 사용했습니다. 이 상태에서는
API 재시작 후 청구·수납·영수증 이력이 사라져 실무 수납 업무를 완료할 수 없었습니다.

## 변경 내용

- `api/.env`에 로컬 Docker PostgreSQL의 `DATABASE_URL`을 설정했습니다.
- `npm.cmd run db:migrate --prefix api`로 최신 수납 원장 migration을 적용했습니다.
- API를 재시작해 `properties`, `tenants`, `contracts`, `monthly_charges`,
  `payment_receipts`, `payment_allocations`를 PostgreSQL repository로 사용하도록 전환했습니다.
- 재시작 후에도 2026-09 월의 `Paid`, `Overdue`, `PartiallyPaid`, `Draft` 청구와
  금액·잔액이 보존되는 것을 확인했습니다.

## 검증 결과

- `GET /health/database`: 로컬 API와 `https://api.approid.team` 모두 `{ "status": "ok" }`.
- `DATABASE_URL=... npm.cmd run test:e2e --prefix api -- billing-postgres.e2e-spec.ts --no-file-parallelism`:
  1개 테스트 통과.
- `PLAYWRIGHT_BASE_URL=https://mnre.approid.team npm.cmd run test:e2e --prefix web -- e2e/auth-session.spec.ts e2e/billing-ledger.spec.ts`:
  비로그인 로그인 리디렉션 1개 통과, Auth0 storage state가 필요한 수납 원장 시나리오 1개 skip.

## 남은 외부 확인

`PropertyManager` 또는 `Admin` Auth0 계정의 로그인 세션이 제공되면
`web/e2e/billing-ledger.spec.ts`를 실행해 Cloudflare 도메인에서 원장 렌더링을 확인합니다.
이 확인은 외부 인증 쿠키가 필요하며, 현재 에이전트 환경에는 제어 가능한 로그인 브라우저가
없어 코드나 데이터베이스 오류와 별개로 보류되어 있습니다.
