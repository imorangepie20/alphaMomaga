# 58단계: 월별 수납 원장 정합성 강화

## 변경 이유

기존 수납 원장은 청구 목록만 선택한 `billingMonth`로 제한하고 영수증 이력은
전체 기간을 표시했다. 따라서 화면의 월별 수납 합계와 이력 목록이 서로 다른
범위를 가리킬 수 있었다. 또한 웹 수납 프록시가 접두사 방식으로 경로를 허용해
명시하지 않은 쓰기 endpoint까지 전달될 여지가 있었다.

## 변경 내용

- `GET /payment-receipts`가 `billingMonth` query를 지원한다.
- 영수증은 해당 월의 `monthly_charge`에 배분(`payment_allocation`)된 경우에만
  선택 월 이력에 포함된다. 여러 청구월에 배분된 영수증은 원본 배분 내역을
  보존하므로 감사 추적과 정정(void) 기록을 잃지 않는다.
- 수납 원장 페이지는 청구, 요약, 영수증을 같은 `billingMonth`로 조회한다.
- 웹의 `POST /api/billing/[...path]` 프록시는 아래의 명시적 명령만 허용한다.
  - `payment-receipts`
  - `monthly-charges/:id/approve`
  - `monthly-charges/:id/cancel`
  - `payment-receipts/:id/void`
  - `billing-runs/:billingMonth`
- 수납 쓰기 권한은 `billing:manage`로 분리했다. `Admin`과
  `PropertyManager`만 보유하며 `Finance`는 조회와 기존 결제 업무 범위만 가진다.

## 검증

- `npm.cmd test --prefix api -- billing.service.spec.ts billing.controller.spec.ts`
- `npm.cmd test --prefix api -- billing.service.spec.ts billing.controller.spec.ts billing.scheduler.spec.ts`
- `npm.cmd run test:e2e --prefix api -- billing.e2e-spec.ts lifecycle-simulation.e2e-spec.ts`
- `vitest`로 `web/src/lib/billing*.test.ts` 실행

