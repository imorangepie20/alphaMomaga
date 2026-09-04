# Billing Run Operations Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** API 재시작 직후에도 해당 월의 청구 초안을 보정하고, 관리자가 수납 원장에서 안전하게 월별 청구 생성을 실행할 수 있게 한다.

**Architecture:** `BillingScheduler`는 application bootstrap에서 기존 idempotent `catchUp()`을 한 번 실행한다. 웹은 기존 `POST /billing-runs/:billingMonth` BFF 경로를 재사용해 수동 생성을 요청하고, 결과를 새로고침하여 초안 승인과 수납 단계로 이어 간다.

**Tech Stack:** NestJS 12, Next.js 16, React 19, Vitest, Auth0 BFF proxy.

**Spec:** `docs/superpowers/specs/2026-09-04-monthly-billing-ledger-design.md`

## Global Constraints

- 흐름은 `property -> tenant -> contract -> monthly charge -> payment -> maintenance` 순서를 유지한다.
- 청구 생성은 기존 `contractId, billingMonth` 유일성 및 idempotent 규칙을 그대로 사용한다.
- 청구 생성은 Draft만 만들며 승인과 수납은 별도 명시적 작업으로 남긴다.
- `Admin`, `PropertyManager`만 변경 API를 실행할 수 있고, Finance의 읽기 권한을 확대하지 않는다.
- 새 동작은 실패 테스트를 먼저 추가하고 API와 웹의 집중 테스트로 검증한다.

---

### Task 1: 재시작 시 월별 청구 보정

**Files:**
- Modify: `api/src/billing/billing.scheduler.ts`
- Modify: `api/src/billing/billing.scheduler.spec.ts`

**Interfaces:**
- Produces: `onApplicationBootstrap(): Promise<void>`가 `catchUp()`을 한 번 호출한다.

- [x] 실패 테스트로 bootstrap이 catch-up을 호출함을 검증한다.
- [x] 테스트가 메서드 부재로 실패하는지 확인한다.
- [x] `OnApplicationBootstrap` 구현과 예외 기록을 추가한다.
- [x] scheduler 집중 테스트를 통과시킨다.

### Task 2: 수동 청구 생성 UI

**Files:**
- Modify: `web/src/lib/billing-client-mutation.ts`
- Modify: `web/src/lib/billing-client-mutation.test.ts`
- Create: `web/src/app/(dashboard)/payments/billing-run-action.tsx`
- Modify: `web/src/app/(dashboard)/payments/page.tsx`

**Interfaces:**
- Produces: `generateBillingRun(billingMonth): Promise<void>`와 `BillingRunAction`.
- Consumes: 기존 `POST /api/billing/billing-runs/:billingMonth` BFF mutation.

- [x] 실패 테스트로 기준월의 billing-run POST를 검증한다.
- [x] 테스트가 export 부재로 실패하는지 확인한다.
- [x] 최소 mutation helper와 상태·권한 오류 안내 UI를 구현한다.
- [x] 빈 원장에서도 청구 생성을 실행할 수 있게 연결한다.
- [x] 웹 집중 테스트를 통과시킨다.

### Task 3: 운영 문서와 최종 검증

**Files:**
- Modify: `docs/overview/monthly-billing-operations.md`

- [x] 재시작 보정, 수동 실행, Draft 검토 절차를 기록한다.
- [x] API scheduler 테스트, 웹 mutation 테스트, API build, 웹 build를 실행한다.
- [ ] 검증 결과를 문서에 기록하고 변경을 커밋·push한다.

## 검증 결과

- 실패 테스트 확인: API bootstrap 메서드와 웹 billing-run mutation/component가 없는 상태에서
  각각 예상대로 실패했습니다.
- 집중 테스트: `billing.scheduler.spec.ts` 2개, `billing-client-mutation.test.ts`와
  `billing-run-action.test.tsx` 5개가 통과했습니다.
- 전체 테스트: API `180 passed`, 웹 `51 passed`.
- build: `npm.cmd run build`를 API와 웹에서 실행했습니다.
- Cloudflare API: `https://api.approid.team/billing-summary?billingMonth=2026-09`가 `401`로
  응답하여 최신 인증 경계와 수납 라우트가 노출됨을 확인했습니다.
