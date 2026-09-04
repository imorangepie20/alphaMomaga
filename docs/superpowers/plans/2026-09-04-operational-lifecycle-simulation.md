# Operational Lifecycle Simulation Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (- [ ]) syntax for tracking.

**Goal:** 가상 자산과 임차인으로 property -> tenant -> contract -> payment -> maintenance -> inspection 전체 업무 흐름을 로컬 API에서 검증하고 Cloudflare 재현 및 안전한 정리 기반을 만든다.

**Architecture:** 현재 인메모리 fallback은 도메인마다 독립 fixture ID 목록을 가져 새 부모 레코드를 다음 단계에서 확인할 수 없다. InMemoryReferenceRegistry provider가 자산, 임차인, 계약의 ID와 소속 관계만 공유하고, 각 서비스는 기존 표시 데이터 배열을 계속 소유한다. 운영 리소스 삭제 API를 제공해 외부 환경에서도 생성 역순 cleanup을 보장한다.

**Tech Stack:** NestJS 12, TypeScript, Drizzle ORM, PostgreSQL, Vitest 4, Supertest

**Spec:** docs/superpowers/specs/2026-09-04-operational-lifecycle-simulation-design.md

## Global Constraints

- 모든 가상 데이터 이름과 작업 제목은 SIM-20260904- 접두사를 사용한다.
- 로컬은 AUTH_ALLOW_DEMO_ROLE=true 및 x-demo-role: PropertyManager만 사용하며 매 테스트마다 새 Nest application을 만든다.
- Cloudflare 실행은 Admin 또는 PropertyManager Auth0 access token이 있을 때만 수행하고 기존 데이터와 fixture를 변경하지 않는다.
- Cloudflare cleanup은 하위 리소스부터 수행한다: payment, contract, maintenance, inspection, tenant, property.
- 의미 있는 변경은 docs/overview/에 원인, 변경, 검증 결과를 한국어로 기록한다.

---

## File Structure

- Create: api/src/domain/in-memory-reference-registry.service.ts - fallback 도메인 간 부모 참조와 소속을 검증한다.
- Create: api/test/lifecycle-simulation.e2e-spec.ts - 전체 API lifecycle, 권한, 오류, cleanup 회귀를 검증한다.
- Modify: api/src/app.module.ts - singleton registry provider를 등록한다.
- Modify: api/src/{properties,tenants,contracts,payments,maintenance,inspections}/*.service.ts - fallback 참조 검증과 등록/제거를 연결한다.
- Modify: api/src/{contracts,payments,maintenance,inspections}/*.controller.ts - 권한 보호 DELETE endpoint를 추가한다.
- Create: api/test/cloudflare-lifecycle-simulation.mjs - bearer token 기반 외부 재현과 finally cleanup을 수행한다.
- Modify: api/package.json - Cloudflare 실행 script를 추가한다.
- Create: docs/overview/phase-59-operational-lifecycle-simulation.md - 원인, 구현, 검증 결과를 기록한다.
- Modify: docs/overview/project-status.md - 완료 상태 및 외부 검증 전제조건을 반영한다.

### Task 1: Write the full-lifecycle API regression test

**Files:**
- Create: api/test/lifecycle-simulation.e2e-spec.ts
- Test: api/test/lifecycle-simulation.e2e-spec.ts

**Interfaces:**
- Consumes: AppModule, current REST endpoints, demo role headers.
- Produces: Dynamic parent-reference and cleanup behavior required by later tasks.

- [ ] **Step 1: Write a failing lifecycle test with an isolated Nest app**

~~~ts
const manager = { 'x-demo-role': 'PropertyManager' };
const prefix = 'SIM-20260904-';
const property = await request(app.getHttpServer()).post('/properties').set(manager)
  .send({ name: prefix + '한강 리버뷰', location: 'Seoul, KR', type: 'Apartment', occupancy: 0, status: 'Active' }).expect(201);
const tenant = await request(app.getHttpServer()).post('/tenants').set(manager)
  .send({ name: prefix + '김하늘', propertyId: property.body.id, unit: 'A-901', rent: '₩1,200,000', status: 'Pending' }).expect(201);
const contract = await request(app.getHttpServer()).post('/contracts').set(manager)
  .send({ propertyId: property.body.id, tenantId: tenant.body.id, unit: 'A-901', monthlyRent: '₩1,200,000', startDate: '2026-09-01', endDate: '2027-08-31', status: 'Active' }).expect(201);
const payment = await request(app.getHttpServer()).post('/payments').set(manager)
  .send({ propertyId: property.body.id, contractId: contract.body.id, amount: '₩1,200,000', dueDate: '2026-09-05', status: 'Pending' }).expect(201);
await request(app.getHttpServer()).put('/payments/' + payment.body.id).set(manager)
  .send({ status: 'Paid', paidAt: '2026-09-05' }).expect(200);
~~~

Add maintenance Pending -> Scheduled -> Completed and inspection Pending -> Scheduled -> Completed with completedAt 2026-09-10. Assert each GET collection includes created IDs and final statuses.

- [ ] **Step 2: Add explicit error and authorization cases**

~~~ts
await request(app.getHttpServer()).post('/contracts').set(manager)
  .send({ propertyId: 'missing-property', tenantId: 'missing-tenant', unit: 'Z-999', monthlyRent: '₩1,000,000', startDate: '2026-09-01', endDate: '2027-08-31', status: 'Active' }).expect(400);
await request(app.getHttpServer()).post('/payments').set(manager)
  .send({ propertyId: property.body.id, contractId: 'missing-contract', amount: '₩1,000,000', dueDate: '2026-09-05', status: 'Pending' }).expect(400);
await request(app.getHttpServer()).post('/maintenance').set('x-demo-role', 'Finance')
  .send({ propertyId: property.body.id, task: prefix + '권한 확인', dueDate: '2026-09-10', status: 'Pending' }).expect(403);
await request(app.getHttpServer()).post('/inspections')
  .send({ propertyId: property.body.id, type: prefix + '무인 점검', scheduledDate: '2026-09-10', status: 'Pending', priority: 'Routine' }).expect(401);
~~~

- [ ] **Step 3: Run the test to confirm the root failure**

Run: npm.cmd --prefix api run test:e2e -- lifecycle-simulation.e2e-spec.ts

Expected: FAIL at contract creation because ContractsService.assertFixtureReferences accepts only fixture property and tenant IDs.

- [ ] **Step 4: Commit and push**

~~~powershell
git add api/test/lifecycle-simulation.e2e-spec.ts
git commit -m "test(api): cover complete property lifecycle"
git push origin main
~~~

### Task 2: Implement dynamic in-memory reference integrity

**Files:**
- Create: api/src/domain/in-memory-reference-registry.service.ts
- Modify: api/src/app.module.ts
- Modify: api/src/properties/properties.service.ts
- Modify: api/src/tenants/tenants.service.ts
- Modify: api/src/contracts/contracts.service.ts
- Modify: api/src/payments/payments.service.ts
- Modify: api/src/maintenance/maintenance.service.ts
- Modify: api/src/inspections/inspections.service.ts
- Test: api/test/lifecycle-simulation.e2e-spec.ts

**Interfaces:**
- Consumes: IDs emitted from existing per-domain memory arrays.
- Produces: InMemoryReferenceRegistry methods assertProperty, assertContractReference, assertPaymentReference, registerProperty, registerTenant, registerContract, removeProperty, removeTenant, and removeContract.

- [ ] **Step 1: Write the registry with fixture seeds and strict ownership checks**

~~~ts
@Injectable()
export class InMemoryReferenceRegistry {
  private readonly propertyIds = new Set(['property-1', 'property-2', 'property-3', 'property-4']);
  private readonly tenantPropertyIds = new Map([['tenant-1', 'property-1'], ['tenant-2', 'property-2'], ['tenant-3', 'property-3'], ['tenant-4', 'property-4']]);
  private readonly contractPropertyIds = new Map([['contract-1', 'property-1'], ['contract-2', 'property-2'], ['contract-3', 'property-3'], ['contract-4', 'property-4']]);

  assertProperty(propertyId: string): void { if (!this.propertyIds.has(propertyId)) throw new Error('Property ' + propertyId + ' not found'); }
  assertContractReference(propertyId: string, tenantId: string): void {
    this.assertProperty(propertyId);
    const tenantPropertyId = this.tenantPropertyIds.get(tenantId);
    if (!tenantPropertyId) throw new Error('Tenant ' + tenantId + ' not found');
    if (tenantPropertyId !== propertyId) throw new Error('Tenant ' + tenantId + ' does not belong to property ' + propertyId);
  }
  assertPaymentReference(propertyId: string, contractId: string): void {
    this.assertProperty(propertyId);
    const contractPropertyId = this.contractPropertyIds.get(contractId);
    if (!contractPropertyId) throw new Error('Contract ' + contractId + ' not found');
    if (contractPropertyId !== propertyId) throw new Error('Contract ' + contractId + ' does not belong to property ' + propertyId);
  }
}
~~~

Missing entries retain existing not-found messages. Mismatched valid IDs throw the ownership errors shown in the code.

- [ ] **Step 2: Register one singleton and inject it only for fallback operation**

~~~ts
providers: [AppService, InMemoryReferenceRegistry, PropertiesService, TenantsService,
  ContractsService, PaymentsService, MaintenanceService, InspectionsService]
~~~

Add an optional constructor dependency in each listed service. Call registry methods only when DatabaseService.client is absent; PostgreSQL and its foreign keys remain authoritative otherwise.

- [ ] **Step 3: Replace fixed fallback reference lists**

~~~ts
this.references?.assertContractReference(input.propertyId, input.tenantId);
this.contracts.push(contractToCreate);
this.references?.registerContract(contractToCreate.id, contractToCreate.propertyId);

this.references?.assertPaymentReference(input.propertyId, input.contractId);
this.payments.push(payment);
~~~

Register/remove properties in PropertiesService, assert/register/remove tenants in TenantsService, and call assertProperty(input.propertyId) from maintenance and inspection creation. Keep each service's own memory array and existing validation functions.

- [ ] **Step 4: Verify lifecycle creation and transitions**

Run: npm.cmd --prefix api run test:e2e -- lifecycle-simulation.e2e-spec.ts

Expected: all creation and update requests pass; cleanup assertions can still fail until Task 3.

- [ ] **Step 5: Commit and push**

~~~powershell
git add api/src/domain/in-memory-reference-registry.service.ts api/src/app.module.ts api/src/properties/properties.service.ts api/src/tenants/tenants.service.ts api/src/contracts/contracts.service.ts api/src/payments/payments.service.ts api/src/maintenance/maintenance.service.ts api/src/inspections/inspections.service.ts
git commit -m "fix(api): preserve dynamic references in memory"
git push origin main
~~~

### Task 3: Add protected cleanup endpoints

**Files:**
- Modify: api/src/contracts/contracts.service.ts
- Modify: api/src/payments/payments.service.ts
- Modify: api/src/maintenance/maintenance.service.ts
- Modify: api/src/inspections/inspections.service.ts
- Modify: api/src/contracts/contracts.controller.ts
- Modify: api/src/payments/payments.controller.ts
- Modify: api/src/maintenance/maintenance.controller.ts
- Modify: api/src/inspections/inspections.controller.ts
- Test: api/test/lifecycle-simulation.e2e-spec.ts

**Interfaces:**
- Consumes: current *:manage permissions and resource IDs.
- Produces: DELETE /contracts/:id, DELETE /payments/:id, DELETE /maintenance/:id, DELETE /inspections/:id.

- [ ] **Step 1: Extend the test with deletion and permission assertions**

~~~ts
await request(app.getHttpServer()).delete('/payments/' + payment.body.id).set(manager).expect(200);
await request(app.getHttpServer()).delete('/contracts/' + contract.body.id).set(manager).expect(200);
await request(app.getHttpServer()).delete('/maintenance/' + maintenance.body.id).set(manager).expect(200);
await request(app.getHttpServer()).delete('/inspections/' + inspection.body.id).set(manager).expect(200);
await request(app.getHttpServer()).delete('/payments/' + payment.body.id).expect(401);
~~~

- [ ] **Step 2: Run it and confirm 404 failures**

Run: npm.cmd --prefix api run test:e2e -- lifecycle-simulation.e2e-spec.ts

Expected: FAIL with HTTP 404 for the first DELETE request.

- [ ] **Step 3: Implement controller and service deletion with audit parity**

~~~ts
@Delete(':id')
@UseGuards(AuthGuard, PermissionsGuard)
@RequirePermission('payment:manage')
async delete(@Param('id') id: string, @Req() request: AuthenticatedRequest): Promise<void> {
  await this.paymentsService.delete(id, request.user);
}
~~~

Implement delete(id, principal?) in every service. The database path uses database.transaction, deletes by ID, throws {Entity} {id} not found when no row is returned, and records contract.deleted, payment.deleted, maintenance.deleted, or inspection.deleted. The memory path only removes its own item; contract deletion also calls references?.removeContract(id). Controllers translate service errors to BadRequestException as existing mutations do.

- [ ] **Step 4: Verify API regression and lint**

Run: npm.cmd --prefix api run test:e2e

Expected: PASS for all API e2e files.

Run: npm.cmd --prefix api run lint

Expected: exit code 0.

- [ ] **Step 5: Commit and push**

~~~powershell
git add api/src/contracts api/src/payments api/src/maintenance api/src/inspections api/test/lifecycle-simulation.e2e-spec.ts
git commit -m "feat(api): add lifecycle cleanup endpoints"
git push origin main
~~~

### Task 4: Add authenticated Cloudflare replay with guaranteed cleanup

**Files:**
- Create: api/test/cloudflare-lifecycle-simulation.mjs
- Modify: api/package.json
- Test: api/test/cloudflare-lifecycle-simulation.mjs

**Interfaces:**
- Consumes: API_BASE_URL, AUTH0_ACCESS_TOKEN, optional SIMULATION_PREFIX.
- Produces: npm.cmd --prefix api run test:lifecycle:cloudflare.

- [ ] **Step 1: Refuse network execution without safe inputs**

~~~js
const baseUrl = process.env.API_BASE_URL;
const accessToken = process.env.AUTH0_ACCESS_TOKEN;
const prefix = process.env.SIMULATION_PREFIX ?? 'SIM-20260904-';
if (!baseUrl || !accessToken) throw new Error('API_BASE_URL and AUTH0_ACCESS_TOKEN are required for Cloudflare lifecycle simulation');
if (!prefix.startsWith('SIM-')) throw new Error('SIMULATION_PREFIX must start with SIM-');
~~~

- [ ] **Step 2: Implement authenticated request and reverse cleanup helpers**

~~~js
async function api(path, options = {}) {
  const response = await fetch(new URL(path, baseUrl), {
    ...options,
    headers: { authorization: 'Bearer ' + accessToken, 'content-type': 'application/json', ...options.headers },
  });
  if (!response.ok) throw new Error((options.method ?? 'GET') + ' ' + path + ' failed: ' + response.status + ' ' + await response.text());
  return response.status === 204 ? undefined : response.json();
}
const cleanup = [];
try {
  const property = await api('/properties', { method: 'POST', body: JSON.stringify({ name: prefix + '한강 리버뷰', location: 'Seoul, KR', type: 'Apartment', occupancy: 0, status: 'Active' }) });
  cleanup.push({ path: '/properties/' + property.id });
  const tenant = await api('/tenants', { method: 'POST', body: JSON.stringify({ name: prefix + '김하늘', propertyId: property.id, unit: 'A-901', rent: '₩1,200,000', status: 'Pending' }) });
  cleanup.push({ path: '/tenants/' + tenant.id });
  const contract = await api('/contracts', { method: 'POST', body: JSON.stringify({ propertyId: property.id, tenantId: tenant.id, unit: 'A-901', monthlyRent: '₩1,200,000', startDate: '2026-09-01', endDate: '2027-08-31', status: 'Active' }) });
  cleanup.push({ path: '/contracts/' + contract.id });
  const payment = await api('/payments', { method: 'POST', body: JSON.stringify({ propertyId: property.id, contractId: contract.id, amount: '₩1,200,000', dueDate: '2026-09-05', status: 'Pending' }) });
  cleanup.push({ path: '/payments/' + payment.id });
  await api('/payments/' + payment.id, { method: 'PUT', body: JSON.stringify({ status: 'Paid', paidAt: '2026-09-05' }) });
} finally {
  for (const item of cleanup.reverse()) await api(item.path, { method: 'DELETE' });
}
~~~

Use the Task 1 payload values and GET assertions. Push delete paths in creation order so reverse cleanup deletes inspection, maintenance, payment, contract, tenant, property. Collect cleanup failures and include their endpoint/status text in the final thrown error.

- [ ] **Step 3: Add the package command and test the guard**

~~~json
"test:lifecycle:cloudflare": "node test/cloudflare-lifecycle-simulation.mjs"
~~~

Run: npm.cmd --prefix api run test:lifecycle:cloudflare

Expected: fail before network access with API_BASE_URL and AUTH0_ACCESS_TOKEN are required for Cloudflare lifecycle simulation when credentials are absent.

- [ ] **Step 4: Run Cloudflare only with a supplied token**

Run: $env:API_BASE_URL='https://api.approid.team'; $env:AUTH0_ACCESS_TOKEN='<provided-token>'; npm.cmd --prefix api run test:lifecycle:cloudflare

Expected: exit code 0 and created IDs plus cleanup confirmation. Without a token, record only this step as 미실행 and do not create Cloudflare data.

- [ ] **Step 5: Commit and push**

~~~powershell
git add api/test/cloudflare-lifecycle-simulation.mjs api/package.json
git commit -m "test(api): add authenticated lifecycle replay"
git push origin main
~~~

### Task 5: Record evidence and run final cross-project verification

**Files:**
- Create: docs/overview/phase-59-operational-lifecycle-simulation.md
- Modify: docs/overview/project-status.md

**Interfaces:**
- Consumes: exact command outputs from Tasks 1 through 4.
- Produces: Korean operational evidence for root cause, behavior, verification, and token prerequisite.

- [ ] **Step 1: Document root cause and behavior in Korean**

~~~markdown
## 근본 원인
로컬 인메모리 서비스가 각각 fixture ID 목록만 검증해 새 자산과 임차인의 관계를 다음 도메인 단계에서 참조할 수 없었다.

## 변경 내용
- InMemoryReferenceRegistry로 자산-임차인-계약 관계를 공유했다.
- 운영 리소스 삭제 endpoint와 audit 기록을 추가했다.
- 전체 lifecycle e2e 및 선택적 Cloudflare 재현 스크립트를 추가했다.
~~~

Include exact command outcomes. If no token was supplied, write that Cloudflare was not run, list API_BASE_URL and AUTH0_ACCESS_TOKEN, and state no Cloudflare data was created.

- [ ] **Step 2: Run final verification**

Run: npm.cmd --prefix api run test:e2e; if ($LASTEXITCODE -eq 0) { npm.cmd --prefix api run lint }; if ($LASTEXITCODE -eq 0) { npm.cmd --prefix api run build }

Expected: exit code 0.

Run: npm.cmd --prefix web run lint; if ($LASTEXITCODE -eq 0) { npm.cmd --prefix web run test }; if ($LASTEXITCODE -eq 0) { npm.cmd --prefix web run build }

Expected: exit code 0.

- [ ] **Step 3: Commit and push documentation**

~~~powershell
git add docs/overview/phase-59-operational-lifecycle-simulation.md docs/overview/project-status.md
git commit -m "docs: record lifecycle simulation verification"
git push origin main
~~~

## Self-Review

### Spec coverage

- 자산부터 점검까지 생성, 상태 변경, GET 재조회는 Task 1과 Task 2가 다룬다.
- 없는 상위 ID, 무인증, Finance 역할 거부는 Task 1이 다룬다.
- 매 테스트별 새 Nest application으로 로컬 상태 격리를 보장한다.
- cleanup 부족은 Task 3의 권한 보호 DELETE와 audit으로 해결한다.
- Auth0 bearer token, 안전 접두사, Cloudflare cleanup은 Task 4가 다룬다.
- 원인, 변경, 검증 문서는 Task 5가 작성한다.

### Placeholder scan

계획의 각 단계는 대상 파일, 검증 명령, 기대 결과, 구현할 인터페이스와 코드 예시를 포함한다. 구현되지 않은 항목을 가리키는 표식은 포함하지 않는다.

### Type consistency

- assertContractReference(propertyId, tenantId)와 assertPaymentReference(propertyId, contractId)의 인자 순서를 모든 호출부에서 고정한다.
- 네 service의 cleanup 함수 이름은 delete(id, principal?)로 통일한다.
- Cloudflare 실행 환경 변수는 API_BASE_URL, AUTH0_ACCESS_TOKEN, SIMULATION_PREFIX로 통일한다.
