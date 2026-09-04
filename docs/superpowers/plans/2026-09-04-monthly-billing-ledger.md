# Monthly Billing Ledger Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 활성 계약에서 월별 청구를 자동 생성하고, 실제 수납과 배분을 근거로 미수 및 연체를 관리하는 운영 원장을 제공한다.

**Architecture:** 기존 `payments`를 변경하지 않고 `monthly_charges`, `payment_receipts`, `payment_allocations`를 별도 원장으로 추가한다. NestJS의 `BillingModule`이 거래와 상태를 소유하고, 모든 금액 재계산과 기준일 상태 계산을 서버에서 수행한다. Next.js는 서버 조회와 인증된 proxy mutation으로 원장을 표시하고 관리한다.

**Tech Stack:** NestJS 12, Drizzle ORM, PostgreSQL, `@nestjs/schedule`, Vitest, Next.js 16, React 19, shadcn/ui, Auth0 access token proxy.

**Spec:** `docs/superpowers/specs/2026-09-04-monthly-billing-ledger-design.md`

## Global Constraints

- 업무 기준 흐름은 `property -> tenant -> contract -> monthly charge -> payment -> maintenance -> inspection`이다.
- 신규 원장은 `contractId, billingMonth` 유일 제약으로 동일 계약의 같은 월 중복 청구를 막는다.
- 금액은 원 단위 정수로 저장하며, 모든 잔액은 서버 트랜잭션 안에서 재계산한다.
- 기준일, 연체, 월 말일 보정은 서버가 Asia/Seoul 기준으로 계산하고 UI는 API 응답을 사용한다.
- 수납 배분이 존재하는 청구는 취소할 수 없으며 영수증 void가 먼저 수행되어야 한다.
- `GET /payments`와 기존 `payments` 테이블은 전환 기간 동안 제거하거나 변환하지 않는다.
- 모든 변경 요청은 Auth0 인증과 역할 기반 권한을 적용하고 감사 로그를 남긴다.
- 각 구현 작업은 실패 테스트부터 작성하고, 해당 작업이 통과한 뒤 커밋한다.

---

## File Structure

- Create: `api/src/billing/billing.module.ts` - 원장 컨트롤러, 서비스, 스케줄러를 묶는다.
- Create: `api/src/billing/billing.ts` - 공개 DTO, 상태, 검증 및 날짜·금액 순수 함수를 제공한다.
- Create: `api/src/billing/billing.service.ts` - 청구 생성, 승인, 취소, 수납, void, 조회를 트랜잭션으로 처리한다.
- Create: `api/src/billing/billing.controller.ts` - 원장 HTTP API와 권한 경계를 제공한다.
- Create: `api/src/billing/billing.scheduler.ts` - 누락 월을 보정하는 일일 생성 작업을 실행한다.
- Create: `api/src/billing/billing.service.spec.ts` - 순수 업무 규칙과 메모리 저장소 동작을 검증한다.
- Create: `api/test/billing.e2e-spec.ts` - 인증, 역할, 원장 전체 흐름을 검증한다.
- Modify: `api/src/database/schema.ts` - 원장 enum, 테이블, 외래 키, 유일 인덱스를 정의한다.
- Modify: `api/src/database/seed.ts` - 현재 계약과 일치하는 청구·영수증·배분 fixture를 넣는다.
- Modify: `api/src/app.module.ts` - `BillingModule`과 `ScheduleModule`을 등록한다.
- Modify: `api/package.json`, `api/package-lock.json` - `@nestjs/schedule` 의존성을 잠근다.
- Modify: `api/src/contracts/contract.ts`, `api/src/contracts/contracts.service.ts` - 계약 청구 규칙을 저장·반환·검증한다.
- Modify: `api/src/roles/role.ts` - 청구 변경 권한을 Admin과 PropertyManager에만 부여한다.
- Modify: `web/src/lib/protected-api.ts` - billing mutation proxy resource와 action을 허용한다.
- Create: `web/src/lib/billing.ts` - 서버 조회 DTO와 API 호출을 담당한다.
- Create: `web/src/lib/billing-mutation.ts` - 월 실행, 승인, 취소, 수납, void 요청을 담당한다.
- Create: `web/src/lib/billing-mutation.test.ts` - 브라우저 mutation 요청·오류 변환을 검증한다.
- Create: `web/src/app/(dashboard)/payments/payment-ledger-manager.tsx` - 월 선택, 승인, 수납, 취소, void UI를 제공한다.
- Modify: `web/src/app/(dashboard)/payments/page.tsx` - legacy 결제 목록 대신 월별 원장을 렌더링한다.
- Modify: `web/src/app/(dashboard)/tenants/page.tsx`, `web/src/app/(dashboard)/tenants/tenant-manager.tsx` - 임차인 단일 납부 상태를 선택 월 원장 요약으로 교체한다.
- Create: `web/src/app/(dashboard)/payments/page.test.tsx` - 기준월·금액·상태·빈 상태 렌더링을 검증한다.
- Create: `docs/overview/monthly-billing-operations.md` - 운영 절차, 전환, 복구, 검증 결과를 기록한다.

### Task 1: 계약 청구 규칙과 데이터베이스 구조

**Files:**
- Modify: `api/src/database/schema.ts`
- Modify: `api/src/contracts/contract.ts`
- Modify: `api/src/contracts/contracts.service.ts`
- Modify: `api/src/contracts/contracts.service.spec.ts`
- Create: `api/drizzle/<generated-migration>.sql`

**Interfaces:**
- Produces: `Contract.billingDay: number`, `Contract.dueDay: number`, `Contract.billingEnabled: boolean`.
- Produces: Drizzle tables `monthlyCharges`, `paymentReceipts`, `paymentAllocations` and enums `monthlyChargeStatus`, `paymentMethod`.
- Produces: `validateBillingDay(value: number): void` and `validateDueDay(value: number): void`.

- [ ] **Step 1: Write the failing contract rule tests**

```ts
it('defaults a new contract to first-day drafting and fifth-day due dates', async () => {
  const created = await new ContractsService().create({ ...input, status: 'Upcoming' }, undefined, referenceDate);
  expect(created).toMatchObject({ billingDay: 1, dueDay: 5, billingEnabled: true });
});

it.each([0, 32, 1.5])('rejects an invalid billing day: %s', (billingDay) => {
  expect(() => validateBillingDay(billingDay)).toThrow('billingDay');
});
```

- [ ] **Step 2: Run the focused test and verify it fails**

Run: `npm test -- contracts.service.spec.ts` from `api`.

Expected: FAIL because the contract fields and validation functions do not exist.

- [ ] **Step 3: Add schema and contract fields**

```ts
export const contracts = pgTable('contracts', {
  // existing columns
  billingDay: integer('billing_day').notNull().default(1),
  dueDay: integer('due_day').notNull().default(5),
  billingEnabled: boolean('billing_enabled').notNull().default(true),
});

export const monthlyCharges = pgTable('monthly_charges', {
  id: varchar('id', { length: 64 }).primaryKey(),
  propertyId: varchar('property_id', { length: 64 }).references(() => properties.id).notNull(),
  tenantId: varchar('tenant_id', { length: 64 }).references(() => tenants.id).notNull(),
  contractId: varchar('contract_id', { length: 64 }).references(() => contracts.id).notNull(),
  billingMonth: varchar('billing_month', { length: 7 }).notNull(),
  dueDate: date('due_date').notNull(),
  baseRentWon: integer('base_rent_won').notNull(),
  adjustmentWon: integer('adjustment_won').notNull().default(0),
  billedWon: integer('billed_won').notNull(),
  receivedWon: integer('received_won').notNull().default(0),
  outstandingWon: integer('outstanding_won').notNull(),
  status: monthlyChargeStatus('status').notNull(),
}, (table) => ({ uniqueMonth: unique().on(table.contractId, table.billingMonth) }));
```

Add nullable approval and cancellation audit columns to `monthly_charges`. Create `payment_receipts` with received amount, method, reference, memo, recording and void columns; create `payment_allocations` with receipt, charge, positive `amount_won`, and timestamp. Generate the Drizzle migration and inspect that existing tenant and payment columns are untouched.

- [ ] **Step 4: Map and validate contract billing rules**

Update all `Contract`, input, mapper, in-memory fixture, insert, renewal, and seed paths. Accept optional create input values, default to `1`, `5`, and `true`; reject non-integer day values outside `1..31`.

- [ ] **Step 5: Run focused tests and migration generation**

Run: `npm test -- contracts.service.spec.ts` from `api`.

Run: `npm run db:generate` from `api`.

Expected: contract tests PASS and generated SQL contains the three new tables, `contract_id,billing_month` unique constraint, and no `DROP` statement for legacy payment data.

- [ ] **Step 6: Commit**

```bash
git add api/src/database/schema.ts api/src/contracts api/drizzle api/package.json api/package-lock.json
git commit -m "feat(api): add billing ledger schema"
```

### Task 2: Billing domain rules and idempotent draft generation

**Files:**
- Create: `api/src/billing/billing.ts`
- Create: `api/src/billing/billing.service.ts`
- Create: `api/src/billing/billing.service.spec.ts`
- Create: `api/src/billing/billing.module.ts`
- Modify: `api/src/app.module.ts`

**Interfaces:**
- Produces: `BillingService.generateMonth(billingMonth: string, principal?: AuthenticatedPrincipal, referenceDate?: Date): Promise<MonthlyCharge[]>`.
- Produces: `calculateDueDate(billingMonth: string, dueDay: number): string`, `getBillingMonth(referenceDate: Date): string`, and `deriveChargeStatus(charge, referenceDate): MonthlyChargeStatus`.
- Consumes: active contracts with billing fields and database transaction executor.

- [ ] **Step 1: Write failing pure-rule and generation tests**

```ts
it('uses the last calendar day when the configured due day exceeds month length', () => {
  expect(calculateDueDate('2028-02', 31)).toBe('2028-02-29');
});

it('generates one draft per eligible active contract and remains idempotent', async () => {
  const service = new BillingService(undefined, undefined, references);
  await service.generateMonth('2026-09', principal, new Date('2026-09-04T00:00:00Z'));
  const second = await service.generateMonth('2026-09', principal, new Date('2026-09-04T00:00:00Z'));
  expect(second).toHaveLength(0);
});
```

- [ ] **Step 2: Run the focused test and verify it fails**

Run: `npm test -- billing.service.spec.ts` from `api`.

Expected: FAIL because the billing module and functions do not exist.

- [ ] **Step 3: Implement the minimal billing service**

Use one service-owned repository path for both database and in-memory testing. A contract is eligible only when `status === 'Active'`, `billingEnabled === true`, and the billing month intersects its effective lease dates. Calculate the due date with UTC calendar operations, create `Draft` with zero adjustment and receipt values, and use `onConflictDoNothing` for the PostgreSQL unique key. Record `charge.generated` with `billingMonth` and `contractId`.

- [ ] **Step 4: Register the module**

```ts
@Module({ providers: [BillingService], exports: [BillingService] })
export class BillingModule {}

@Module({ imports: [DatabaseModule, AuditModule, BillingModule] })
export class AppModule {}
```

Keep contract lifecycle synchronization in `ContractsService`; `BillingService` must query only current active contracts instead of duplicating contract status rules.

- [ ] **Step 5: Run focused tests**

Run: `npm test -- billing.service.spec.ts` from `api`.

Expected: PASS for idempotency, date end-of-month correction, inactive/disabled contract exclusion, and exact rent amount creation.

- [ ] **Step 6: Commit**

```bash
git add api/src/billing api/src/app.module.ts
git commit -m "feat(api): generate monthly charge drafts"
```

### Task 3: Approval, receipt allocation, void, and status recalculation

**Files:**
- Modify: `api/src/billing/billing.ts`
- Modify: `api/src/billing/billing.service.ts`
- Modify: `api/src/billing/billing.service.spec.ts`

**Interfaces:**
- Produces: `approveCharge(id, principal)`, `cancelCharge(id, reason, principal)`, `recordReceipt(input, principal)`, and `voidReceipt(id, reason, principal)`.
- Produces: `PaymentReceiptInput` with `propertyId`, `tenantId`, `receivedDate`, `amountWon`, `method`, optional `reference`, `memo`, and non-empty `allocations`.
- Produces: charge response fields `billedWon`, `receivedWon`, `outstandingWon`, `status`, `asOfDate`.

- [ ] **Step 1: Write failing money-flow tests**

```ts
it('marks an approved charge partially paid after a valid partial allocation', async () => {
  const receipt = await service.recordReceipt({ amountWon: 400000, allocations: [{ chargeId, amountWon: 400000 }], ...receiptInput }, principal);
  expect(receipt.amountWon).toBe(400000);
  expect(await service.findCharge(chargeId, referenceDate)).toMatchObject({ receivedWon: 400000, outstandingWon: 800000, status: 'PartiallyPaid' });
});

it('rejects over-allocation and cancellation after receipt allocation', async () => {
  await expect(service.recordReceipt({ amountWon: 100, allocations: [{ chargeId, amountWon: 101 }], ...receiptInput }, principal)).rejects.toThrow('allocation');
  await expect(service.cancelCharge(chargeId, 'duplicate', principal)).rejects.toThrow('allocated receipt');
});
```

- [ ] **Step 2: Run the focused test and verify it fails**

Run: `npm test -- billing.service.spec.ts` from `api`.

Expected: FAIL because receipt and allocation actions do not exist.

- [ ] **Step 3: Implement atomic mutation rules**

Within one transaction, lock the receipt and affected charge rows, verify every charge belongs to the receipt property and tenant, requires `Approved` or `PartiallyPaid`, and has sufficient outstanding balance. Insert receipt and allocations, recompute each affected charge using `sum(payment_allocations.amount_won)` for non-voided receipts, then derive its state. For a void, mark the receipt without deleting rows and run the same recomputation. Record `charge.approved`, `charge.cancelled`, `receipt.recorded`, `receipt.voided`, and `allocation.created` events.

- [ ] **Step 4: Implement deterministic status rules**

```ts
if (charge.status === 'Cancelled') return 'Cancelled';
if (outstandingWon === 0) return 'Paid';
if (receivedWon > 0 && dueDate >= asOfDate) return 'PartiallyPaid';
if (dueDate < asOfDate) return 'Overdue';
return 'Approved';
```

Never persist an alternative status merely because the browser supplied a different date. Return `asOfDate` on all read models.

- [ ] **Step 5: Run focused tests**

Run: `npm test -- billing.service.spec.ts` from `api`.

Expected: PASS for approval, cancellation, partial/full payment, same-property checks, over-allocation rejection, void balance restoration, and overdue derivation.

- [ ] **Step 6: Commit**

```bash
git add api/src/billing
git commit -m "feat(api): record and allocate payment receipts"
```

### Task 4: Authenticated billing API and daily catch-up scheduler

**Files:**
- Create: `api/src/billing/billing.controller.ts`
- Create: `api/src/billing/billing.scheduler.ts`
- Modify: `api/src/billing/billing.module.ts`
- Modify: `api/src/roles/role.ts`
- Modify: `api/src/app.module.ts`
- Modify: `api/package.json`, `api/package-lock.json`
- Create: `api/test/billing.e2e-spec.ts`

**Interfaces:**
- Produces: `POST /billing-runs/:billingMonth`, `GET /monthly-charges`, `POST /monthly-charges/:id/approve`, `POST /monthly-charges/:id/cancel`, `POST /payment-receipts`, `POST /payment-receipts/:id/void`, `GET /tenants/:id/ledger`, and `GET /billing-summary`.
- Produces: `BillingScheduler.catchUp(referenceDate?: Date): Promise<void>`.
- Consumes: `billing:manage` permission for mutations and `portfolio:read` for read operations.

- [ ] **Step 1: Write failing HTTP and role-boundary tests**

```ts
await request(app.getHttpServer()).post('/billing-runs/2026-09').expect(401);
await request(app.getHttpServer()).post('/billing-runs/2026-09').set(financeToken).expect(403);
await request(app.getHttpServer()).post('/billing-runs/2026-09').set(managerToken).expect(201);
await request(app.getHttpServer()).get('/billing-summary?billingMonth=2026-09').set(financeToken).expect(200);
```

- [ ] **Step 2: Run the e2e test and verify it fails**

Run: `npm run test:e2e -- billing.e2e-spec.ts` from `api`.

Expected: FAIL because routes, permission, and scheduler dependencies do not exist.

- [ ] **Step 3: Add permissions and controller routes**

Add `billing:manage` to `Permission`, grant it only to `Admin` and `PropertyManager`, retain `portfolio:read` for Finance read access. Guard every billing route with `AuthGuard` and `PermissionsGuard`; convert invalid input, missing IDs, invalid references, allocation errors, and illegal state transitions to HTTP 400. Preserve HTTP 401 and 403 from the guards.

- [ ] **Step 4: Add a catch-up scheduler**

Install `@nestjs/schedule`, import `ScheduleModule.forRoot()` once in `AppModule`, and invoke `BillingService.generateMonth(getBillingMonth(referenceDate), systemPrincipal, referenceDate)` from a daily `@Cron` configured with `timeZone: 'Asia/Seoul'`. The public `catchUp` method accepts a date for tests; the cron wrapper passes `new Date()`.

- [ ] **Step 5: Run e2e tests**

Run: `npm run test:e2e -- billing.e2e-spec.ts` from `api`.

Expected: PASS for authenticated generation, Finance read-only access, lifecycle mutations, invalid cross-property allocation, and exact summary totals.

- [ ] **Step 6: Commit**

```bash
git add api/src/billing api/src/roles/role.ts api/src/app.module.ts api/package.json api/package-lock.json api/test/billing.e2e-spec.ts
git commit -m "feat(api): expose authenticated billing operations"
```

### Task 5: Seed data, PostgreSQL transaction checks, and operations documentation

**Files:**
- Modify: `api/src/database/seed.ts`
- Create: `api/test/billing-postgres.e2e-spec.ts`
- Create: `docs/overview/monthly-billing-operations.md`

**Interfaces:**
- Produces: seed data where the active contract, monthly charge, receipt, and allocation IDs reference each other correctly.
- Produces: a documented production migration checklist that explicitly requires backup and review before `db:migrate`.

- [ ] **Step 1: Write the failing database lifecycle test**

```ts
it('enforces one charge per contract and month under concurrent generation', async () => {
  await Promise.all([service.generateMonth('2026-09', principal, referenceDate), service.generateMonth('2026-09', principal, referenceDate)]);
  expect(await repository.countByContractMonth('contract-1', '2026-09')).toBe(1);
});
```

- [ ] **Step 2: Run the PostgreSQL test and verify it fails before configuration**

Run: `DATABASE_URL=<test-postgres-url> npm run test:e2e -- billing-postgres.e2e-spec.ts` from `api`.

Expected: FAIL until the migration has been applied to the dedicated test database; never point this command at production.

- [ ] **Step 3: Replace incompatible seed payment fixtures with ledger fixtures**

Keep existing legacy `payments` seed rows unchanged. Insert current-month `monthly_charges`, including one paid, one overdue, one partially paid, and one Draft example. Insert receipts and allocations that reconcile `received_won` and `outstanding_won` exactly.

- [ ] **Step 4: Document operations and migration**

Document the manager workflow: run or verify draft generation, inspect Draft records, approve valid charges, record and allocate receipts, void mistaken receipt, then review overdue balances. Include the rollback boundary: new tables can be rolled back only before production use; after entries exist, use compensating void/cancel actions instead of deletion. State that legacy tenant status and legacy payments are not authoritative for the new ledger.

- [ ] **Step 5: Run database verification**

Run: `npm run db:migrate` from `api` against a dedicated local test database.

Run: `DATABASE_URL=<test-postgres-url> npm run test:e2e -- billing-postgres.e2e-spec.ts` from `api`.

Expected: PASS for unique constraint, row locking/recalculation, void restoration, and audit event creation.

- [ ] **Step 6: Commit**

```bash
git add api/src/database/seed.ts api/test/billing-postgres.e2e-spec.ts docs/overview/monthly-billing-operations.md
git commit -m "docs: add billing operations runbook"
```

### Task 6: Web data contracts and protected mutation proxy

**Files:**
- Create: `web/src/lib/billing.ts`
- Create: `web/src/lib/billing-mutation.ts`
- Create: `web/src/lib/billing-mutation.test.ts`
- Modify: `web/src/lib/protected-api.ts`
- Modify: `web/src/lib/protected-api.test.ts`

**Interfaces:**
- Produces: `MonthlyCharge`, `BillingSummary`, `TenantLedger`, and `PaymentReceipt` TypeScript types matching API JSON.
- Produces: `getMonthlyCharges(billingMonth: string)`, `getBillingSummary(billingMonth: string)`, and `getTenantLedger(tenantId: string, billingMonth: string)`.
- Produces: `runBillingMonth`, `approveMonthlyCharge`, `cancelMonthlyCharge`, `recordPaymentReceipt`, and `voidPaymentReceipt` browser mutation functions.

- [ ] **Step 1: Write failing request tests**

```ts
it('posts a receipt through the authenticated billing proxy', async () => {
  await recordPaymentReceipt({ propertyId: 'property-1', tenantId: 'tenant-1', amountWon: 1200000, receivedDate: '2026-09-04', method: 'BankTransfer', allocations: [{ chargeId: 'charge-1', amountWon: 1200000 }] });
  expect(fetch).toHaveBeenCalledWith('/api/proxy/payment-receipts', expect.objectContaining({ method: 'POST' }));
});
```

- [ ] **Step 2: Run the focused test and verify it fails**

Run: `npm test -- billing-mutation.test.ts` from `web`.

Expected: FAIL because the billing data and mutation modules do not exist.

- [ ] **Step 3: Implement read and mutation modules**

Use `getApiUrl()` with `cache: 'no-store'` for server reads. Do not return invented payment fallback data when `API_URL` is configured but the request fails; return a typed unavailable result so the page can show a retryable error instead. Add `monthly-charges`, `payment-receipts`, and `billing-runs` to protected proxy resource routing, then add explicit action routes for `approve`, `cancel`, and `void` because they are not generic resource CRUD paths.

- [ ] **Step 4: Make protected proxy behavior testable**

Extend `forwardProtectedMutation` only with an explicit, typed billing action union. Test that it forwards the Auth0 access token, preserves JSON bodies, returns API status unchanged, and rejects a resource/action pair outside the allow list.

- [ ] **Step 5: Run web data tests**

Run: `npm test -- billing-mutation.test.ts protected-api.test.ts` from `web`.

Expected: PASS for payload shape, 401/403 propagation, 502 handling, and action allow-list enforcement.

- [ ] **Step 6: Commit**

```bash
git add web/src/lib web/src/app/api/proxy
git commit -m "feat(web): add billing data and mutation clients"
```

### Task 7: Payment ledger operations screen

**Files:**
- Modify: `web/src/app/(dashboard)/payments/page.tsx`
- Create: `web/src/app/(dashboard)/payments/payment-ledger-manager.tsx`
- Create: `web/src/app/(dashboard)/payments/page.test.tsx`

**Interfaces:**
- Consumes: `MonthlyCharge[]`, `BillingSummary`, and billing mutation functions from Task 6.
- Produces: monthly ledger table with billing month, due date, billed, received, outstanding, operational status, and manager actions.

- [ ] **Step 1: Write failing page and interaction tests**

```tsx
it('shows the selected billing month and actual billed, received, and outstanding amounts', async () => {
  render(<PaymentLedgerManager charges={[charge]} summary={summary} billingMonth="2026-09" />);
  expect(screen.getByText('2026년 9월')).toBeInTheDocument();
  expect(screen.getByText('₩1,200,000')).toBeInTheDocument();
  expect(screen.getByText('₩800,000')).toBeInTheDocument();
  expect(screen.getByText('₩400,000')).toBeInTheDocument();
});
```

- [ ] **Step 2: Run the focused test and verify it fails**

Run: `npm test -- payments/page.test.tsx` from `web`.

Expected: FAIL because the page still renders legacy payments.

- [ ] **Step 3: Replace the legacy payment table**

Render a server-selected current billing month and a manager component with month navigation. Display summary cards for approved billed total, received total, outstanding total, overdue count, and unapproved Draft count. In the table show property, tenant, unit, due date, billed, received, outstanding, and status. Use semantic status colors through existing badge tokens, not hard-coded dark-theme classes.

- [ ] **Step 4: Add guarded operational forms**

Use `Dialog`, `FormField`, `Input`, and `NativeSelect` patterns already used by managers. The receipt form requires date, positive integer amount, method, and at least one allocation; it shows each selected charge balance and prevents a client-side amount above the displayed balance while retaining server validation. The cancel and void dialogs require a non-empty reason. Disable mutation buttons while pending, show a 401 re-login instruction, a 403 permission message, and a retryable network error; call `router.refresh()` only after success.

- [ ] **Step 5: Run focused web tests**

Run: `npm test -- payments/page.test.tsx` from `web`.

Expected: PASS for totals, month label, Draft approval, receipt validation, action error state, and empty ledger state.

- [ ] **Step 6: Commit**

```bash
git add 'web/src/app/(dashboard)/payments'
git commit -m "feat(web): manage monthly billing ledger"
```

### Task 8: Tenant and dashboard summaries use billing facts

**Files:**
- Modify: `web/src/app/(dashboard)/tenants/page.tsx`
- Modify: `web/src/app/(dashboard)/tenants/tenant-manager.tsx`
- Modify: `web/src/app/(dashboard)/dashboard/default/page.tsx`
- Modify: `web/src/lib/tenants.ts`
- Modify: `web/src/lib/tenant-mutation.ts`
- Modify: `web/src/lib/tenant-mutation.test.ts`
- Create: `web/src/app/(dashboard)/tenants/page.test.tsx`

**Interfaces:**
- Consumes: selected-month charge and tenant ledger read models.
- Produces: tenant list columns `기준월`, `납부기한`, `청구`, `수납`, `미수`, `상태`.
- Produces: dashboard billing summary that navigates to `/payments?billingMonth=YYYY-MM`.

- [ ] **Step 1: Write failing tenant page tests**

```tsx
it('does not render a tenant-owned payment status control', async () => {
  render(<TenantManager tenants={[tenant]} properties={properties} ledgers={ledgers} billingMonth="2026-09" />);
  expect(screen.queryByLabelText('상태')).not.toBeInTheDocument();
  expect(screen.getByText('미수 ₩400,000')).toBeInTheDocument();
});
```

- [ ] **Step 2: Run the focused test and verify it fails**

Run: `npm test -- tenants/page.test.tsx tenant-mutation.test.ts` from `web`.

Expected: FAIL because tenants own editable `Paid`, `Pending`, and `Overdue` fields.

- [ ] **Step 3: Remove the incorrect tenant payment-state source**

Remove status from tenant create/update input and the tenant dialog. Keep tenant identity, property, unit, and contractual display rent. Join selected-month ledger data by tenant ID in the page; show a neutral no-charge state for tenants without an eligible current contract instead of presenting them as unpaid.

- [ ] **Step 4: Replace fixture dashboard aggregates**

Use `getBillingSummary` in the default dashboard page. Render current month billed, received, outstanding, overdue count, and Draft approval count as links to the payment ledger. Keep maintenance and inspection widgets independent of billing calculations.

- [ ] **Step 5: Run focused web tests**

Run: `npm test -- tenants/page.test.tsx tenant-mutation.test.ts` from `web`.

Expected: PASS for no tenant payment editor, selected-month values, no-charge state, and dashboard summary links.

- [ ] **Step 6: Commit**

```bash
git add 'web/src/app/(dashboard)/tenants' 'web/src/app/(dashboard)/dashboard/default' web/src/lib/tenants.ts web/src/lib/tenant-mutation.ts web/src/lib/tenant-mutation.test.ts
git commit -m "feat(web): show tenant billing by month"
```

### Task 9: End-to-end verification, accessibility, and deployment runbook update

**Files:**
- Modify: `docs/overview/cloudflare-browser-testing.md`
- Modify: `docs/overview/monthly-billing-operations.md`
- Create: `web/e2e/billing-ledger.spec.ts`

**Interfaces:**
- Consumes: deployed Auth0 role user, Cloudflare tunnel URL, and a safe test property/tenant/contract fixture.
- Produces: repeatable create-draft-approve-receipt-void-cleanup browser validation.

- [ ] **Step 1: Write the Playwright scenario**

```ts
test('manager can approve a draft, record a partial receipt, and see the remaining balance', async ({ page }) => {
  await page.goto('/payments?billingMonth=2026-09');
  await page.getByRole('button', { name: '청구 확정' }).first().click();
  await page.getByRole('button', { name: '수납 등록' }).first().click();
  await page.getByLabel('수납 금액').fill('400000');
  await page.getByRole('button', { name: '수납 저장' }).click();
  await expect(page.getByText('미수 ₩800,000')).toBeVisible();
});
```

- [ ] **Step 2: Run the scenario and verify it fails before the UI exists**

Run: `npm run test:e2e -- billing-ledger.spec.ts` from `web`.

Expected: FAIL until Tasks 6 through 8 are complete and a browser test account is configured.

- [ ] **Step 3: Verify visual and accessibility behavior**

Use Playwright locators by label and role for month selection, dialogs, amount fields, confirmation buttons, alert text, and table status text. Confirm keyboard focus returns to the triggering action after each dialog closes, all controls have visible labels, and status is communicated by text in addition to color.

- [ ] **Step 4: Document the Cloudflare test procedure**

Add required Auth0 permissions, safe fixture naming, expected API calls, cleanup order, and the rule that production-like financial data is never deleted by automated browser tests. Include the expected 401 re-login and 403 role-denied outcomes as separate tests.

- [ ] **Step 5: Run full verification**

Run: `npm test` from `api`.

Run: `npm run test:e2e` from `api`.

Run: `npm run build` from `api`.

Run: `npm run lint` from `api`.

Run: `npm test` from `web`.

Run: `npm run lint` from `web`.

Run: `npm run build` from `web`.

Run: `npm run test:e2e -- billing-ledger.spec.ts` from `web` against the configured Cloudflare URL.

Expected: all local commands PASS; browser result is recorded as PASS, skipped only when no browser/auth account is available, or failed with the exact blocking condition.

- [ ] **Step 6: Commit**

```bash
git add web/e2e/billing-ledger.spec.ts docs/overview/cloudflare-browser-testing.md docs/overview/monthly-billing-operations.md
git commit -m "test(web): verify billing ledger workflow"
```

## Self-Review

### Spec coverage

- 계약 청구 규칙, 월별 청구, receipt/allocation, 상태 계산, 취소/void, 자동 보정, RBAC, 감사 로그, API, 전환, web 원장, 임차인 월별 표시, 대시보드, PostgreSQL, Cloudflare 검증은 Tasks 1 through 9에 각각 포함했다.
- 기존 `payments`를 변환하거나 삭제하지 않는 제약은 Tasks 1 and 5에 포함했다.
- 고급 운영 요구인 부분 납부, 미수, 연체, 원장 보존, 권한, 감사 추적, 복구 절차는 Tasks 3 through 5 and 9에 포함했다.

### Placeholder scan

계획 전체를 미완성 표기와 모호한 지시어로 검사했고 발견된 항목은 없다. Drizzle migration file name is generated by the existing tool and is scoped as `<generated-migration>.sql` because the timestamp is intentionally tool-owned.

### Type consistency

- `BillingService.generateMonth`, `approveCharge`, `cancelCharge`, `recordReceipt`, and `voidReceipt` are defined in Tasks 2 and 3 before their controller and web consumers in Tasks 4 and 6.
- `MonthlyCharge`, `PaymentReceipt`, `BillingSummary`, and `TenantLedger` originate in Task 6 and are consumed only by Tasks 7 and 8.
- `billing:manage` is introduced in Task 4 before protected API mutation routes and UI actions depend on it.
