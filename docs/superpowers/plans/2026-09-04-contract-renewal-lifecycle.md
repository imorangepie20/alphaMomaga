# Contract Renewal Lifecycle Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 관리자가 종료일 이전에도 계약을 안전하게 갱신하고 계약 상태·이력을 일관되게 관리하게 한다.

**Architecture:** `POST /contracts/:id/renew`는 원본 계약의 속성·임차인·호실을 재사용해 후속 계약을 생성한다. `ContractsService`는 UTC 달력 날짜로 `Upcoming -> Active -> Expired` 상태를 정합화하고, 해지 계약의 실제 해지일을 고려해 계약 기간 중복을 검증한다.

**Tech Stack:** NestJS 12, Drizzle ORM, Vitest, Next.js 16, React 19, shadcn/ui, Playwright

**Spec:** `docs/superpowers/specs/2026-09-04-contract-renewal-lifecycle-design.md`

## Global Constraints

- `property -> tenant -> contract -> payment -> maintenance` 흐름과 `Payment.contractId` 참조를 보존한다.
- 모든 쓰기 API는 `contract:manage` 권한과 Auth0 BFF 경계를 유지한다.
- 계약 날짜는 UTC `YYYY-MM-DD`로 비교한다.
- 생성과 갱신 모두 기간 중복을 허용하지 않으며 계약 삭제를 추가하지 않는다.
- 모든 새 동작은 실패 테스트를 먼저 실행한다.

---

### Task 1: Lifecycle service rules

**Files:**
- Modify: `api/src/contracts/contract.ts`
- Modify: `api/src/contracts/contracts.service.ts`
- Modify: `api/src/contracts/contracts.service.spec.ts`

**Interfaces:**
- Produces: `RenewContractInput`, `ContractsService.renew(id, input, principal?, referenceDate?)`, `findAll(referenceDate?)`
- Consumes: `Contract`, `validateContract`, `AuditService`

- [ ] **Step 1: Write failing service tests**

```ts
it('creates an upcoming successor using source identity fields', async () => {
  const renewed = await service.renew('contract-1', {
    startDate: '2027-09-01', endDate: '2028-08-31', monthlyRent: '₩1,300,000',
  }, principal, new Date('2026-09-04T00:00:00.000Z'));
  expect(renewed).toEqual(expect.objectContaining({
    propertyId: 'property-1', tenantId: 'tenant-1', unit: 'A-101', status: 'Upcoming',
  }));
});

it('rejects a renewal that does not start the day after the source end date', async () => {
  await expect(service.renew('contract-1', {
    startDate: '2027-09-02', endDate: '2028-09-01', monthlyRent: '₩1,300,000',
  }, undefined, referenceDate)).rejects.toThrow('must start on the day after');
});
```

- [ ] **Step 2: Verify RED**

Run: `npm.cmd --prefix api run test -- contracts.service.spec.ts`

Expected: FAIL because `renew` and reference-date synchronization are absent.

- [ ] **Step 3: Add lifecycle interfaces and helpers**

```ts
export type RenewContractInput = {
  startDate: string;
  endDate: string;
  monthlyRent: string;
};

function calendarDayAfter(value: string): string {
  const date = new Date(`${value}T00:00:00.000Z`);
  date.setUTCDate(date.getUTCDate() + 1);
  return date.toISOString().slice(0, 10);
}
```

Add a helper that only converts due `Upcoming` records to `Active` and expired `Active`
records to `Expired`.

- [ ] **Step 4: Implement in-memory renewal and overlap validation**

```ts
async renew(id: string, input: RenewContractInput, principal?: AuthenticatedPrincipal, referenceDate = new Date()) {
  this.synchronizeInMemoryContracts(referenceDate);
  const source = this.findRequiredContract(id);
  this.assertRenewable(source, input, referenceDate);
  const renewed = this.buildRenewedContract(source, input, referenceDate);
  this.assertNoOverlappingContract(renewed, source.id);
  this.contracts.push(renewed);
  return renewed;
}
```

Use `terminatedAt` as a terminated contract's effective end date and compare intervals inclusively.

- [ ] **Step 5: Implement DB synchronization and renewal transaction**

```ts
return database.transaction(async (transaction) => {
  const source = await findSourceContract(transaction, id);
  const synchronized = await synchronizeDatabaseContract(transaction, source, referenceDate);
  const renewed = buildRenewedContract(mapContractRow(synchronized), input, referenceDate);
  await assertNoDatabaseOverlap(transaction, renewed, source.id);
  const [row] = await transaction.insert(contracts).values(toContractRow(renewed)).returning();
  await auditService.record(transaction, { action: 'contract.renewed', entityId: row.id, metadata: { sourceContractId: id } });
  return mapContractRow(row);
});
```

Make `findAll(referenceDate?)` synchronize DB rows transactionally before returning them; synchronize before `update` validation too.

- [ ] **Step 6: Verify GREEN and commit**

Run: `npm.cmd --prefix api run test -- contracts.service.spec.ts`

Commit: `git add -- api/src/contracts/contract.ts api/src/contracts/contracts.service.ts api/src/contracts/contracts.service.spec.ts; git commit -m "feat(api): add contract renewal lifecycle"`

### Task 2: Protected renewal endpoint

**Files:**
- Modify: `api/src/contracts/contracts.controller.ts`
- Modify: `api/src/contracts/contracts.controller.spec.ts`
- Modify: `web/src/lib/protected-api.ts`
- Modify: `web/src/lib/protected-api.test.ts`
- Create: `web/src/app/api/proxy/contracts/[id]/renew/route.ts`

**Interfaces:**
- Produces: `POST /contracts/:id/renew`, `POST /api/proxy/contracts/:id/renew`
- Consumes: `ContractsService.renew`, `forwardProtectedMutation`

- [ ] **Step 1: Write failing controller and BFF tests**

```ts
await expect(controller.renew('contract-1', input, request)).resolves.toEqual(contract);
expect(service.renew).toHaveBeenCalledWith('contract-1', input, request.user);

await forwardProtectedMutation('contracts', request, 'contract-1', 'renew');
expect(fetch).toHaveBeenCalledWith(expect.stringMatching(/contracts\/contract-1\/renew$/), expect.anything());
```

- [ ] **Step 2: Verify RED**

Run: `npm.cmd --prefix api run test -- contracts.controller.spec.ts`

Run: `npm.cmd --prefix web run test -- src/lib/protected-api.test.ts`

Expected: FAIL because the endpoint and BFF action path do not exist.

- [ ] **Step 3: Add guarded controller and exact BFF route**

```ts
@Post(':id/renew')
@UseGuards(AuthGuard, PermissionsGuard)
@RequirePermission('contract:manage')
async renew(@Param('id') id: string, @Body() input: RenewContractInput, @Req() request: AuthenticatedRequest) {
  return this.contractsService.renew(id, input, request.user);
}
```

Extend `forwardProtectedMutation` with a literal `renew` action only, then add the route
that calls `forwardProtectedMutation('contracts', request, params.id, 'renew')`.

- [ ] **Step 4: Verify GREEN and commit**

Run: `npm.cmd --prefix api run test -- contracts.controller.spec.ts`

Run: `npm.cmd --prefix web run test -- src/lib/protected-api.test.ts`

Commit: `git add -- api/src/contracts/contracts.controller.ts api/src/contracts/contracts.controller.spec.ts web/src/lib/protected-api.ts web/src/lib/protected-api.test.ts 'web/src/app/api/proxy/contracts/[id]/renew/route.ts'; git commit -m "feat(api): expose protected contract renewal"`

### Task 3: Renewal UI

**Files:**
- Modify: `web/src/lib/contract-mutation.ts`
- Modify: `web/src/lib/contract-mutation.test.ts`
- Modify: `web/src/app/(dashboard)/contracts/contract-manager.tsx`

**Interfaces:**
- Produces: `renewContract(id, input)` and a row-level renewal dialog
- Consumes: `POST /api/proxy/contracts/:id/renew`

- [ ] **Step 1: Write failing mutation test**

```ts
await renewContract('contract-1', {
  startDate: '2027-09-01', endDate: '2028-08-31', monthlyRent: 1300000,
});
expect(fetch).toHaveBeenCalledWith(
  '/api/proxy/contracts/contract-1/renew',
  expect.objectContaining({ method: 'POST', body: expect.stringContaining('₩1,300,000') }),
);
```

- [ ] **Step 2: Verify RED**

Run: `npm.cmd --prefix web run test -- src/lib/contract-mutation.test.ts`

Expected: FAIL because `renewContract` is not exported.

- [ ] **Step 3: Implement mutation and dialog**

```ts
export async function renewContract(id: string, input: RenewContractMutationInput): Promise<void> {
  await request(`/api/proxy/contracts/${encodeURIComponent(id)}/renew`, 'POST', {
    ...input,
    monthlyRent: `₩${input.monthlyRent.toLocaleString('en-US')}`,
  });
}
```

Add a `갱신` button for `Active`/`Expired` rows. The dialog renders tenant, property, unit,
and successor start date read-only. It accepts only successor end date and monthly rent, then
calls `renewContract` and `router.refresh()`.

- [ ] **Step 4: Verify GREEN and commit**

Run: `npm.cmd --prefix web run test -- src/lib/contract-mutation.test.ts`

Run: `web\node_modules\.bin\tsc.cmd --noEmit --project web\tsconfig.json`

Commit: `git add -- web/src/lib/contract-mutation.ts web/src/lib/contract-mutation.test.ts 'web/src/app/(dashboard)/contracts/contract-manager.tsx'; git commit -m "feat(web): add contract renewal workflow"`

### Task 4: Documentation and full verification

**Files:**
- Create: `docs/overview/phase-58-contract-renewal-lifecycle.md`
- Modify: `docs/architecture/property-management-domain.md`

- [ ] **Step 1: Document final Korean behavior**

Record the cause, renewal API, dates, lifecycle synchronization, payment-history preservation,
permissions, and browser validation instructions. Update the domain document with successor
contract semantics while retaining `Payment.contractId`.

- [ ] **Step 2: Run complete verification**

Run: `npm.cmd --prefix api run test`

Run: `npm.cmd --prefix api run build`

Run: `npm.cmd --prefix web run test -- src/lib/contract-mutation.test.ts src/lib/protected-api.test.ts`

Run: `web\node_modules\.bin\tsc.cmd --noEmit --project web\tsconfig.json`

Run: `npm.cmd --prefix web run test:e2e -- e2e/auth-session.spec.ts`

Run: `git diff --check`

Expected: all commands exit 0.

- [ ] **Step 3: Commit, push, and inspect the final worktree**

Commit: `git add -- docs/overview/phase-58-contract-renewal-lifecycle.md docs/architecture/property-management-domain.md; git commit -m "docs: document contract renewal lifecycle"; git push origin main; git status --short --branch`
