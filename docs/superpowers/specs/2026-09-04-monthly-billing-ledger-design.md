# 월별 청구 및 수납 원장 설계

## 확정 운영 제약

- 실제 데이터베이스의 월별 청구 유일 제약은 `contractId, billingMonth` 조합으로 둔다. 속성과 임차인은 계약에서 결정되므로 같은 계약의 같은 월 청구를 확실히 막을 수 있다.
- 청구일과 납부기한의 일이 해당 월 마지막 날보다 크면 마지막 날로 보정한다. 예를 들어 31일 납부기한은 2월에는 2월 말일이다.
- 청구 원금, 조정 금액, 수납 금액, 배분 금액은 모두 원 단위 정수로 저장한다.
- 수납 배분이 하나라도 존재하는 청구는 직접 취소할 수 없다. 잘못 기록된 수납은 영수증을 먼저 void하여 배분과 잔액을 되돌린 뒤, 잔액이 남은 Draft 또는 Approved 청구만 취소할 수 있다.
- 자동 청구 생성은 `@nestjs/schedule` 기반의 일일 작업으로 구현한다. Asia/Seoul 기준으로 billingDay가 지났지만 해당 월 청구가 없는 활성 계약을 idempotent하게 생성하므로, 서버 재시작이나 작업 실패로 실행을 놓쳐도 다음 실행에서 보정된다.
- 조회 API에서 `billingMonth`를 생략하면 서버의 업무 기준일을 기준으로 현재 월을 사용한다. 응답에는 기준일과 계산된 상태를 포함해 브라우저 시계나 지역 설정에 따라 결과가 달라지지 않게 한다.

## 목표

임차인에 저장된 단일 납부 상태를 제거하고, 활성 계약을 기준으로 생성되는 월별 청구와 실제 수납 원장을 통해 수납, 부분 납부, 연체, 계약 위험을 관리한다.

## 범위

첫 번째 운영 완성도 개선 프로젝트는 다음 흐름을 완성한다.

~~~text
active contract -> monthly charge draft -> manager approval -> payment receipt -> allocation -> balance and overdue status
~~~

정비, 점검, 보고서, 입주자 포털은 동일 원장을 소비하도록 후속 프로젝트에서 확장한다.

## 도메인 모델

### Contract billing rule

Contract에 다음 필드를 추가한다.

- billingDay: 매월 청구 초안 생성일. 기본값 1.
- dueDay: 매월 납부기한 일자. 기본값 5.
- billingEnabled: 자동 청구 대상 여부. 기본값 true.

활성 계약만 청구 대상이며, 계약 시작월과 종료월의 포함 여부는 계약 기간 안에 기준월의 청구일이 있는지로 판단한다.

### MonthlyCharge

MonthlyCharge는 계약 하나의 기준월에 대한 청구 원장이다.

- id
- propertyId
- tenantId
- contractId
- billingMonth: YYYY-MM
- dueDate
- baseRentWon
- adjustmentWon: 할인과 추가 청구의 합계. 첫 단계 기본값 0.
- billedWon: baseRentWon + adjustmentWon
- receivedWon: 배분된 수납액 합계
- outstandingWon: billedWon - receivedWon
- status: Draft, Approved, PartiallyPaid, Paid, Overdue, Cancelled
- approvedAt, approvedBy, cancelledAt, cancelledBy, cancellationReason
- createdAt, updatedAt

contractId, billingMonth 조합은 유일해야 한다. 동일 계약의 동일 월 청구를 중복 생성할 수 없다.

### PaymentReceipt and PaymentAllocation

PaymentReceipt는 실제로 받은 돈이고 PaymentAllocation은 그 돈을 청구에 배분한 내역이다.

PaymentReceipt:
- id, propertyId, tenantId
- receivedDate, amountWon
- method: BankTransfer, Cash, Card, Other
- reference, memo
- recordedBy, recordedAt, voidedAt, voidedBy, voidReason

PaymentAllocation:
- id, receiptId, chargeId, amountWon, createdAt

수납액은 0보다 커야 하고, 유효한 receipt의 allocation 합계는 receipt.amountWon을 넘을 수 없다. allocation 후 charge의 receivedWon은 배분 합계로 재계산한다.

## 상태와 기준일

- Draft: 자동 생성됐지만 관리자가 확정하지 않았다.
- Approved: 확정됐고 수납이 없다.
- PartiallyPaid: 수납액이 0보다 크고 billedWon보다 작다.
- Paid: outstandingWon이 0이다.
- Overdue: Approved 또는 PartiallyPaid이며 dueDate가 기준일보다 과거이고 outstandingWon이 0보다 크다.
- Cancelled: 관리자가 이유와 함께 취소했다.

Overdue는 기준일에 따라 서버에서 계산하고 조회 응답에 반영한다. UI는 브라우저 시계가 아니라 API 응답의 기준일과 상태를 사용한다.

## 업무 흐름

1. scheduler는 매일 활성 계약을 확인하고 billingDay가 지났지만 해당 월 Draft 청구가 없는 계약에 대해 idempotent하게 청구를 생성한다.
2. 관리자는 Draft 목록에서 계약 변경, 공실, 할인, 중도 입퇴거를 검토한 뒤 Approved로 확정하거나 Cancelled로 취소한다.
3. 관리자는 PaymentReceipt를 등록하고 하나 이상의 Approved 또는 PartiallyPaid 청구에 배분한다.
4. API는 배분 뒤 receivedWon과 outstandingWon을 transaction 안에서 재계산한다.
5. 조회 시 API는 dueDate와 기준일로 Overdue 상태를 계산한다.
6. 감사 로그는 charge.generated, charge.approved, charge.cancelled, receipt.recorded, receipt.voided, allocation.created를 기록한다.

## API

- POST /billing-runs/:billingMonth: Admin 또는 PropertyManager가 월별 초안을 수동 재실행한다. scheduler와 같은 idempotent 로직을 사용한다.
- GET /monthly-charges?billingMonth=YYYY-MM&status=&propertyId=: 기준월별 원장 목록이다.
- POST /monthly-charges/:id/approve: Draft 청구를 확정한다.
- POST /monthly-charges/:id/cancel: 배분된 수납이 없는 Draft 또는 Approved 청구를 사유와 함께 취소한다.
- POST /payment-receipts: 실제 수납을 등록한다. allocations 배열을 함께 받는다.
- POST /payment-receipts/:id/void: 수납과 그 배분을 취소하고 잔액을 재계산한다.
- GET /tenants/:id/ledger?billingMonth=YYYY-MM: 임차인별 기준월 원장과 최근 수납 내역을 반환한다.
- GET /billing-summary?billingMonth=YYYY-MM: 청구, 수납, 미수, 연체, 초안 건수를 반환한다.

기존 GET /payments는 전환 기간 동안 legacy 응답을 유지한다. 신규 운영 화면은 monthly-charges, payment-receipts, billing-summary만 사용한다.

## 화면

### 수납 원장

기본 기준월은 서버가 반환한 현재 월이다. 표에는 자산, 호실, 임차인, 기준월, 납부기한, 청구액, 수납액, 미납잔액, 상태를 표시한다. 필터는 기준월, 자산, 상태, 연체만 제공한다.

### 임차인

단일 status 열을 제거한다. 현재 선택 기준월의 상태, 납부기한, 청구액, 수납액, 미납잔액을 표시하고, 행 또는 상세 화면에서 원장과 수납 등록을 연다.

### 대시보드

billing-summary를 사용해 이번 달 청구액, 수납액, 미수금, 연체 건수, 미확정 초안 건수를 표시한다. 기존 fixture 집계는 제거한다.

## 데이터 전환

- 새 테이블과 enum을 migration으로 추가한다. 기존 tenants.status와 payments는 즉시 삭제하지 않는다.
- 기존 Payment는 billingMonth와 실제 수납액을 알 수 없으므로 새 원장으로 자동 변환하지 않는다.
- 개발 seed는 계약 월 임대료와 일치하는 MonthlyCharge 및 PaymentReceipt를 생성한다.
- 새 화면이 배포된 뒤 legacy tenant status와 payments API를 deprecation 문서로 표시한다.
- 실제 운영 DB 전환 전에는 백업과 migration 검토가 필요하다.

## 권한과 오류

- PropertyManager와 Admin만 billing run, 청구 확정, 수납 등록·취소를 수행한다.
- Finance는 billing-summary와 원장을 읽을 수 있지만 변경은 수행하지 않는다.
- 없는 계약, 비활성 계약, 다른 자산의 청구 배분, 중복 기준월, 초과 배분, 취소된 청구 배분은 HTTP 400으로 거부한다.
- 인증되지 않은 요청은 401, 역할 권한이 없으면 403을 반환한다.

## 검증

- 단위 테스트: 상태 계산, 기준월 생성, 중복 방지, 부분 납부, 초과 배분, 취소 후 잔액 복구.
- API e2e: 계약 생성부터 billing run, 승인, 부분 수납, 완납, 연체, 취소와 권한 경계를 검증한다.
- PostgreSQL e2e: unique constraint와 transaction 재계산을 검증한다.
- Web test: 기준월 표시와 API 원장 렌더링을 검증한다.
- Cloudflare: Auth0 access token이 제공될 때 SIM- 접두사 데이터로 전체 흐름을 실행하고 cleanup한다.
