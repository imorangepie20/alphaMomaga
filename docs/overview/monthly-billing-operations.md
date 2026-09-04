# 월별 수납 원장 운영 절차

## 원칙

수납의 기준 데이터는 `monthly_charges`, `payment_receipts`, `payment_allocations`입니다.
기존 `tenants.status`와 `payments`는 호환용 과거 데이터이므로 월별 납부 상태를
판단하거나 수정하는 근거로 사용하지 않습니다.

임차인 상세 또는 보고서에는 `GET /tenants/:tenantId/ledger?billingMonth=YYYY-MM`을
사용합니다. 이 API는 해당 월의 청구, 관련 영수증, 청구·수납·미수 합계를 같은
기준으로 반환합니다.

## 월간 처리 순서

1. `/payments?billingMonth=YYYY-MM`에서 청구 초안이 생성되었는지 확인합니다. API는
   시작 직후 해당 월의 누락 청구를 한 번 보정하고, 운영자는 수납 원장의 `청구 초안 생성`
   버튼으로 같은 idempotent 작업을 수동 실행할 수 있습니다.
2. 계약, 임대료, 납부기한을 검토한 뒤 유효한 `Draft` 청구를 승인합니다.
3. 입금이 확인되면 수납일, 방법, 실제 금액을 입력하고 대상 청구에 정확히 배분합니다.
4. 오기입 영수증은 삭제하지 않고 사유를 입력해 `void` 처리합니다. 미수금은 자동 복구됩니다.
5. 연체 청구와 미수금을 검토하고 필요한 안내 또는 후속 조치를 기록합니다.

한 영수증으로 같은 임차인의 여러 월 미수금을 처리할 때는 수납 등록 창에서
각 청구의 배분 금액을 입력합니다. 영수증 총액은 배분 금액의 합으로 계산되며,
각 배분액은 해당 청구의 미수금을 초과할 수 없습니다.

은행 이체번호, 카드 승인번호 등 추적 가능한 정보는 `거래 참조번호`에 기록하고,
정정 배경이나 내부 확인 내용은 `메모`에 남깁니다. 두 값은 영수증 이력과 함께
보존되어 void 판단과 감사 확인에 사용됩니다.

## 권한

- `Admin`, `PropertyManager`: 청구 생성·승인·취소, 수납 등록, 영수증 void
- `Finance`: 원장과 요약 조회만 가능
- 모든 원장 변경은 감사 로그와 원본 영수증·배분 기록을 남깁니다.

## 청구 초안이 없을 때

수납 원장에 청구가 없다고 해서 수납을 먼저 등록하지 않습니다. 해당 청구월을 선택한 뒤
`청구 초안 생성`을 실행합니다. 이 작업은 활성 계약만 대상으로 하며 이미 생성된
`contractId, billingMonth` 청구를 중복으로 만들지 않습니다. 생성 결과가 없으면 해당 월에
청구 가능한 활성 계약이 없는 것이므로 계약 기간, 상태, `billingEnabled` 설정을 확인합니다.

생성된 청구는 반드시 `Draft` 상태입니다. 임대료와 납부기한을 검토해 `청구 확정`한 후에만
수납 영수증을 등록할 수 있습니다.

## PostgreSQL 적용 절차

1. 운영 DB를 백업하고 migration SQL을 검토합니다.
2. 운영 DB가 아닌 전용 테스트 DB에서 `npm.cmd run db:migrate --prefix api`와 `npm.cmd run db:seed --prefix api`를 먼저 실행합니다.
3. 시드에는 현재 서울 청구월의 납부 완료, 연체, 부분 납부, 승인 대기 예시가 포함됩니다.
4. 테스트에서 청구 생성, 승인, 부분 수납, void 후 미수 복구를 검증합니다.
5. 운영 적용 후에는 원장 레코드를 삭제하지 않습니다. 기존 거래의 정정은 `void` 또는 청구 취소 같은 상계 작업으로만 처리합니다.

`DATABASE_URL`은 폐기 가능한 테스트 DB에만 지정해 검증합니다. 운영 DB에 자동화 테스트나 시드 명령을 실행하지 않습니다.

## Cloudflare 브라우저 확인

Auth0 `PropertyManager` 테스트 계정으로 로그인한 세션 파일을 준비한 뒤 아래처럼
읽기 전용 원장 검증을 실행합니다.

```powershell
$env:PLAYWRIGHT_BASE_URL = 'https://mnre.approid.team'
$env:PLAYWRIGHT_AUTH_STORAGE_STATE = 'C:\safe-path\property-manager-session.json'
cd C:\Users\jowoo\alpahMomega\web
npm.cmd run test:e2e -- e2e/billing-ledger.spec.ts
```

세션 파일이 없으면 테스트는 의도적으로 skip됩니다. 자동 브라우저 테스트로 운영
수납을 등록하거나 void하지 않으며, 변경 흐름은 별도 안전 fixture에서만 검증합니다.

## PostgreSQL 통합 검증

전용 개발 또는 CI 데이터베이스에서는 다음 명령으로 동시 청구 생성과 영수증 void
후 잔액 복구를 검증합니다.

```powershell
$env:DATABASE_URL = '<dedicated-test-postgres-url>'
npm.cmd run test:e2e --prefix api -- billing-postgres.e2e-spec.ts --no-file-parallelism
```

테스트는 고유한 자산·임차인·계약 fixture를 만들고 종료 시 원장 배분, 영수증,
청구, 계약, 임차인, 자산 순서로 정리합니다.
