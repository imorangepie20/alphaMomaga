# 라이트 전용 UI 시스템 구현 계획

> **For agentic workers:** REQUIRED SUB-SKILL: Use `superpowers:subagent-driven-development` (recommended) or `superpowers:executing-plans` to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 관리 애플리케이션 전체를 항상 라이트 테마로 렌더링하고, 모든 폼과 공통 UI가 하나의 토큰 및 컴포넌트 규칙을 사용하도록 정비한다.

**Architecture:** 전역 루트가 라이트 모드를 명시하고, `globals.css`가 색상·간격·컨트롤의 의미 기반 토큰을 제공한다. 기존 `Field` 계열을 관리 폼의 표준 경계로 확장하고, 기본 UI 컴포넌트와 화면군을 순서대로 전환하여 업무 동작은 보존한다.

**Tech Stack:** Next.js 16, React 19, TypeScript, Tailwind CSS 4, Base UI, Vitest, Playwright.

**Spec:** `docs/superpowers/specs/2026-09-04-light-only-ui-system-design.md`

## Global Constraints

- 라이트 테마만 제공하며 `ThemeProvider`, `ThemeToggle`, 런타임 시스템 테마 추적을 다시 추가하지 않는다.
- API endpoint, Auth0 인증 경계, 권한, 데이터 모델 및 `property -> tenant -> contract -> payment -> maintenance` 업무 규칙을 변경하지 않는다.
- 폼 라벨과 컨트롤 간격은 8px(`gap-2`), 필드 간격은 16px(`gap-4`), 기본 컨트롤 높이는 36px(`h-9`)으로 유지한다.
- 제목은 `text-2xl font-semibold`, 섹션과 다이얼로그 제목은 `text-lg font-medium`, 라벨과 표 헤더는 `text-sm font-medium`, 본문과 컨트롤은 `text-sm font-normal`을 사용한다.
- 의미 있는 구현 변경마다 `docs/overview/`에 원인, 변경, 검증 결과를 한국어로 기록한다.
- 각 커밋 후 `git push`로 `origin/main`에 반영한다.

---

## File Structure

- Modify: `web/src/app/layout.tsx` - 라이트 HTML 루트 계약을 명시한다.
- Modify: `web/src/app/globals.css` - 라이트 전용 토큰과 브라우저 네이티브 컨트롤 규칙을 정의한다.
- Modify: `web/package.json`, `web/package-lock.json` - 사용하지 않는 `next-themes` 의존성을 제거한다.
- Modify: `web/src/components/ui/field.tsx` - 관리 폼 표준 `FormField` 경계를 제공한다.
- Modify: `web/src/components/ui/{input,textarea,native-select,select,label,dialog,card,table,button}.tsx` - 공통 밀도, 타입, 상태, 다이얼로그 규칙을 적용한다.
- Modify: `web/src/app/(dashboard)/{properties,tenants,contracts,payments,maintenance,inspections}/` - 업무 화면의 폼과 다이얼로그를 표준 컴포넌트로 전환한다.
- Modify: `web/src/components/layout/` and `web/src/app/(dashboard)/layout.tsx` - 앱 셸의 라이트 전용 시각 규칙을 적용한다.
- Modify: `web/src/components/pages/`, `web/src/components/dashboards/`, `web/src/app/(auth)/`, `web/src/app/(dashboard)/admin/` - 제품 페이지와 관리자 화면을 전환한다.
- Modify: `web/src/components/apps/`, `web/src/app/(dashboard)/apps/`, `web/src/app/(dashboard)/components/`, `web/src/app/(dashboard)/blocks/`, `web/src/app/(dashboard)/templates/`, `web/src/app/(dashboard)/widgets/` - 데모·템플릿 화면의 잔여 어두운 변형과 임의 폼을 정리한다.
- Test: `web/src/app/layout.test.ts`, `web/src/app/globals.test.ts`, `web/src/components/ui/field.test.tsx`, `web/src/app/(dashboard)/forms-layout.test.ts` - 전역 계약과 폼 구조를 검증한다.
- Create: `docs/overview/phase-60-light-only-ui-system.md` - 원인, 마이그레이션, 검증 결과를 기록한다.

### Task 1: 라이트 전용 루트 계약 확정

**Files:**
- Modify: `web/src/app/layout.tsx`
- Modify: `web/src/app/layout.test.ts`
- Modify: `web/src/app/globals.css`
- Modify: `web/src/app/globals.test.ts`
- Modify: `web/package.json`
- Modify: `web/package-lock.json`

**Interfaces:**
- Produces: 서버 렌더링 시 항상 `<html lang="ko" className="light">`이고 `color-scheme: light`가 적용되는 앱 루트.
- Produces: 어떠한 브라우저·HMR 상태에서도 시스템 테마가 화면 색상을 바꾸지 않는 CSS 계약.

- [ ] **Step 1: 라이트 루트 실패 테스트를 작성한다.**

```ts
expect(rootLayout).toContain('<html lang="ko" className="light"')
expect(rootLayout).not.toContain("ThemeProvider")
expect(globalStyles).toMatch(/:root\s*\{[^}]*color-scheme:\s*light;/s)
expect(globalStyles).not.toMatch(/\.dark\s*\{[^}]*color-scheme:\s*dark;/s)
```

- [ ] **Step 2: 테스트가 현재 루트 및 잔여 다크 CSS에서 실패하는지 확인한다.**

Run: `npm.cmd --prefix web run test -- src/app/layout.test.ts src/app/globals.test.ts`

Expected: FAIL because the root does not yet declare `className="light"` and active dark color-scheme rules remain.

- [ ] **Step 3: 최소 구현으로 테마 경로를 제거한다.**

```tsx
<html lang="ko" className="light">
```

```css
:root {
  color-scheme: light;
}
```

`globals.css`의 `.dark` 토큰 및 `dark:` 전용 전역 규칙을 제거하고, `next-themes`를 `package.json`과 lockfile에서 제거한다. 다크 변형은 화면 전환 작업에서 제거하되, 어떤 경로도 다크 색상 토큰을 활성화하지 않도록 한다.

- [ ] **Step 4: 단위 테스트와 의존성 검증을 실행한다.**

Run: `npm.cmd --prefix web run test -- src/app/layout.test.ts src/app/globals.test.ts`

Expected: PASS.

Run: `npm.cmd --prefix web run lint -- src/app/layout.tsx src/app/globals.test.ts src/app/layout.test.ts`

Expected: PASS with no `next-themes` import.

- [ ] **Step 5: 커밋하고 푸시한다.**

```powershell
git add web/src/app/layout.tsx web/src/app/layout.test.ts web/src/app/globals.css web/src/app/globals.test.ts web/package.json web/package-lock.json
git commit -m "fix(web): enforce light-only root theme"
git push
```

### Task 2: 토큰과 공통 컨트롤 계약 정리

**Files:**
- Modify: `web/src/app/globals.css`
- Modify: `web/src/components/ui/input.tsx`
- Modify: `web/src/components/ui/textarea.tsx`
- Modify: `web/src/components/ui/native-select.tsx`
- Modify: `web/src/components/ui/select.tsx`
- Modify: `web/src/components/ui/label.tsx`
- Modify: `web/src/components/ui/button.tsx`
- Modify: `web/src/components/ui/card.tsx`
- Modify: `web/src/components/ui/table.tsx`
- Test: `web/src/app/globals.test.ts`

**Interfaces:**
- Consumes: Task 1의 라이트 전용 루트.
- Produces: `--surface`, `--surface-muted`, `--text`, `--text-muted`, `--control-height`, `--control-border`, `--dialog-padding` 토큰과 일관된 기본 컨트롤 렌더링.

- [ ] **Step 1: 컨트롤 계약 실패 테스트를 추가한다.**

```ts
expect(globalStyles).toContain("--control-height: 2.25rem")
expect(inputSource).toContain("h-9")
expect(nativeSelectSource).toContain("h-9")
expect(nativeSelectSource).not.toContain("dark:")
```

- [ ] **Step 2: 테스트가 기존 다크 변형 및 분산된 값에서 실패하는지 확인한다.**

Run: `npm.cmd --prefix web run test -- src/app/globals.test.ts`

Expected: FAIL until all common controls reference the light-only contract.

- [ ] **Step 3: 공통 UI에 최소 토큰 기반 스타일을 적용한다.**

```tsx
className={cn(
  "h-9 w-full rounded-lg border border-input bg-background px-2.5 text-sm font-normal",
  "focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50",
  className,
)}
```

`Input`, `Textarea`, `NativeSelect`, Base UI `Select`의 높이, 글자 굵기, 테두리, 포커스, 비활성 상태를 맞춘다. `NativeSelectOption`과 `optgroup`은 라이트 시스템 색상으로 렌더링하고, `Button`, `Card`, `Table`의 과도한 굵기와 다크 변형을 제거한다.

- [ ] **Step 4: 공통 UI 테스트와 lint를 실행한다.**

Run: `npm.cmd --prefix web run test -- src/app/globals.test.ts`

Expected: PASS.

Run: `npm.cmd --prefix web run lint -- src/components/ui/input.tsx src/components/ui/textarea.tsx src/components/ui/native-select.tsx src/components/ui/select.tsx src/components/ui/label.tsx src/components/ui/button.tsx src/components/ui/card.tsx src/components/ui/table.tsx`

Expected: PASS.

- [ ] **Step 5: 커밋하고 푸시한다.**

```powershell
git add web/src/app/globals.css web/src/components/ui
git commit -m "refactor(web): standardize light form controls"
git push
```

### Task 3: 표준 관리 폼 경계 도입

**Files:**
- Modify: `web/src/components/ui/field.tsx`
- Create: `web/src/components/ui/field.test.tsx`
- Modify: `web/src/components/ui/dialog.tsx`
- Modify: `web/src/app/(dashboard)/forms-layout.test.ts`

**Interfaces:**
- Consumes: Task 2 공통 컨트롤 계약.
- Produces: `FormField({ label, htmlFor, description, error, children })`와 `FormField`가 제공하는 `data-slot="form-field"`, `data-slot="form-field-label"`, `data-slot="form-field-error"` 구조.

- [ ] **Step 1: `FormField` 렌더링 실패 테스트를 작성한다.**

```tsx
render(
  <FormField label="임차인" htmlFor="tenant" error="임차인을 선택하세요">
    <Input id="tenant" />
  </FormField>,
)
expect(screen.getByLabelText("임차인")).toBeInTheDocument()
expect(screen.getByRole("alert")).toHaveTextContent("임차인을 선택하세요")
expect(screen.getByTestId("form-field")).toHaveClass("gap-2")
```

- [ ] **Step 2: 테스트가 새 export 부재로 실패하는지 확인한다.**

Run: `npm.cmd --prefix web run test -- src/components/ui/field.test.tsx`

Expected: FAIL because `FormField` is not exported yet.

- [ ] **Step 3: `Field` 조합을 감싼 최소 `FormField`를 구현한다.**

```tsx
function FormField({ label, htmlFor, description, error, children }: FormFieldProps) {
  return (
    <Field data-slot="form-field" data-testid="form-field" className="gap-2">
      <FieldLabel data-slot="form-field-label" htmlFor={htmlFor}>{label}</FieldLabel>
      {children}
      {description ? <FieldDescription>{description}</FieldDescription> : null}
      {error ? <FieldError data-slot="form-field-error">{error}</FieldError> : null}
    </Field>
  )
}
```

`DialogContent`, `DialogHeader`, `DialogFooter`, `DialogTitle`의 패딩과 글자 굵기를 명세의 다이얼로그 구조에 맞춘다. footer는 본문과 과도하게 대비되는 색을 사용하지 않는다.

- [ ] **Step 4: 폼 단위 테스트 및 정적 레이아웃 테스트를 실행한다.**

Run: `npm.cmd --prefix web run test -- src/components/ui/field.test.tsx src/app/(dashboard)/forms-layout.test.ts`

Expected: PASS.

- [ ] **Step 5: 커밋하고 푸시한다.**

```powershell
git add web/src/components/ui/field.tsx web/src/components/ui/field.test.tsx web/src/components/ui/dialog.tsx web/src/app/(dashboard)/forms-layout.test.ts
git commit -m "feat(web): add consistent management form field"
git push
```

### Task 4: 핵심 업무 화면의 폼과 다이얼로그 전환

**Files:**
- Modify: `web/src/app/(dashboard)/properties/property-manager.tsx`
- Modify: `web/src/app/(dashboard)/tenants/tenant-manager.tsx`
- Modify: `web/src/app/(dashboard)/contracts/contract-manager.tsx`
- Modify: `web/src/app/(dashboard)/payments/page.tsx`
- Modify: `web/src/app/(dashboard)/maintenance/page.tsx`
- Modify: `web/src/app/(dashboard)/inspections/page.tsx`
- Modify: `web/src/app/(dashboard)/forms-layout.test.ts`
- Create: `docs/overview/phase-60-light-only-ui-system.md`

**Interfaces:**
- Consumes: Task 3 `FormField`.
- Produces: 핵심 업무 등록·수정 다이얼로그에서 모든 라벨, 컨트롤, 설명, 오류가 `FormField`와 공통 UI를 사용하는 화면.

- [ ] **Step 1: 각 업무 매니저의 표준 폼 사용 실패 테스트를 작성한다.**

```ts
for (const source of [propertyManager, tenantManager, contractManager]) {
  expect(source).toContain("FormField")
  expect(source).not.toMatch(/<select(?![^>]*NativeSelect)/)
}
expect(contractManager).toContain('htmlFor="contract-tenant"')
```

- [ ] **Step 2: 테스트가 기존 직접 `Label`/`Input` 및 네이티브 `select` 조합에서 실패하는지 확인한다.**

Run: `npm.cmd --prefix web run test -- src/app/(dashboard)/forms-layout.test.ts`

Expected: FAIL until the three manager screens use `FormField` and `NativeSelect` consistently.

- [ ] **Step 3: 업무 화면을 필드 단위로 전환한다.**

```tsx
<FormField label="계약 시작일" htmlFor="contract-start-date">
  <Input id="contract-start-date" type="date" value={form.startDate} onChange={onChange} />
</FormField>
```

`properties -> tenants -> contracts -> payments -> maintenance -> inspections` 순서로 전환한다. 기존 상태, mutation 호출, 성공·실패 메시지, 권한 및 목록 새로고침 코드는 바꾸지 않는다. `select`는 `NativeSelect`와 `NativeSelectOption`을 사용한다.

- [ ] **Step 4: 업무 기능 회귀 테스트를 실행한다.**

Run: `npm.cmd --prefix web run test -- src/lib/property-mutation.test.ts src/lib/tenant-mutation.test.ts src/lib/contract-mutation.test.ts src/app/(dashboard)/forms-layout.test.ts`

Expected: PASS.

Run: `npm.cmd --prefix web run lint -- src/app/(dashboard)/properties/property-manager.tsx src/app/(dashboard)/tenants/tenant-manager.tsx src/app/(dashboard)/contracts/contract-manager.tsx src/app/(dashboard)/payments/page.tsx src/app/(dashboard)/maintenance/page.tsx src/app/(dashboard)/inspections/page.tsx`

Expected: PASS.

- [ ] **Step 5: Cloudflare Tunnel에서 업무 다이얼로그를 수동 확인하고 결과를 문서화한다.**

Run: `https://mnre.approid.team/properties`, `https://mnre.approid.team/tenants`, `https://mnre.approid.team/contracts`

Expected: 라이트 전용 화면, 읽기 쉬운 select 목록, 8px 라벨 간격, 등록·수정 mutation 정상 동작.

- [ ] **Step 6: 커밋하고 푸시한다.**

```powershell
git add web/src/app/(dashboard) docs/overview/phase-60-light-only-ui-system.md
git commit -m "refactor(web): unify operational management forms"
git push
```

### Task 5: 앱 셸과 인증 화면 전환

**Files:**
- Modify: `web/src/app/(dashboard)/layout.tsx`
- Modify: `web/src/components/layout/app-header.tsx`
- Modify: `web/src/components/layout/app-sidebar.tsx`
- Modify: `web/src/components/layout/{breadcrumbs,command-palette,notifications}.tsx`
- Modify: `web/src/app/(auth)/layout.tsx`
- Modify: `web/src/app/(auth)/login/page.tsx`
- Modify: `web/src/app/(auth)/register/page.tsx`
- Modify: `web/src/app/(auth)/forgot-password/page.tsx`
- Modify: `web/src/app/(auth)/reset-password/page.tsx`
- Modify: `web/src/app/(auth)/verify/page.tsx`
- Modify: `web/src/components/auth/{auth-card,social-buttons}.tsx`

**Interfaces:**
- Consumes: Tasks 1-3의 라이트 토큰과 공통 UI.
- Produces: 대시보드 셸과 Auth0 진입 화면이 같은 surface, 텍스트, 포커스, hover 규칙을 사용하는 레이아웃.

- [ ] **Step 1: 앱 셸·인증 소스의 잔여 다크 변형 실패 테스트를 작성한다.**

```ts
for (const source of shellAndAuthSources) {
  expect(source).not.toContain("dark:")
  expect(source).not.toContain("ThemeToggle")
}
```

- [ ] **Step 2: 테스트가 잔여 `dark:` 클래스에서 실패하는지 확인한다.**

Run: `npm.cmd --prefix web run test -- src/app/layout.test.ts`

Expected: FAIL until the test fixture includes all shell and auth sources and their dark variants are removed.

- [ ] **Step 3: 셸과 인증 화면을 토큰 기반 클래스로 전환한다.**

```tsx
className="bg-background text-foreground"
className="border-border bg-card text-card-foreground"
```

사이드바, 헤더, breadcrumb, command palette, 알림, 로그인 카드의 임의 색상과 과도한 폰트 굵기를 공통 semantic class로 바꾼다. Auth0 redirect URL이나 로그인 API 호출은 변경하지 않는다.

- [ ] **Step 4: lint와 브라우저 진입 검증을 실행한다.**

Run: `npm.cmd --prefix web run lint -- src/app/(dashboard)/layout.tsx src/components/layout src/app/(auth) src/components/auth`

Expected: PASS.

Run: `https://mnre.approid.team/` and Auth0 login/logout flow.

Expected: 라이트 화면 유지와 로그인·로그아웃 redirect 정상 동작.

- [ ] **Step 5: 커밋하고 푸시한다.**

```powershell
git add web/src/app/(dashboard)/layout.tsx web/src/components/layout web/src/app/(auth) web/src/components/auth
git commit -m "refactor(web): align shell and auth with light ui"
git push
```

### Task 6: 제품 관리자 페이지와 설정의 테마 의미 정리

**Files:**
- Modify: `web/src/components/pages/settings/settings-page.tsx`
- Modify: `web/src/components/pages/users/users-page.tsx`
- Modify: `web/src/app/(dashboard)/admin/users/page.tsx`
- Modify: `web/src/app/(dashboard)/admin/roles/page.tsx`
- Modify: `web/src/app/(dashboard)/admin/reports/page.tsx`
- Modify: `web/src/app/(dashboard)/users/page.tsx`
- Modify: `web/src/components/dashboards/real-estate/`
- Modify: `web/src/components/dashboards/default/`

**Interfaces:**
- Consumes: Tasks 1-3의 라이트 UI 계약.
- Produces: 설정에 실제로 동작하지 않는 light/dark/system 선택지가 없고, 사용자·역할·보고서·부동산 대시보드가 공통 밀도를 사용한다.

- [ ] **Step 1: 설정 테마 선택기 제거 실패 테스트를 작성한다.**

```ts
expect(settingsPage).not.toMatch(/value=["']dark["']/)
expect(settingsPage).not.toMatch(/value=["']system["']/)
expect(settingsPage).toContain("라이트 테마")
```

- [ ] **Step 2: 테스트가 기존 가짜 테마 선택지에서 실패하는지 확인한다.**

Run: `npm.cmd --prefix web run test -- src/app/layout.test.ts`

Expected: FAIL until settings no longer presents unsupported dark/system choices.

- [ ] **Step 3: 제품 페이지를 공통 토큰과 타입 규칙으로 전환한다.**

```tsx
<p className="text-sm text-muted-foreground">이 애플리케이션은 라이트 테마를 사용합니다.</p>
```

설정의 테마 selector를 읽기 전용 라이트 테마 안내로 대체하고, 사용자·역할·보고서 페이지와 실제 부동산 대시보드의 `dark:` 클래스, 수동 색상, 과도한 `font-bold`를 정리한다. 역할·사용자 권한 데이터와 보고서 데이터 요청은 변경하지 않는다.

- [ ] **Step 4: lint와 관리자 회귀 테스트를 실행한다.**

Run: `npm.cmd --prefix web run lint -- src/components/pages/settings/settings-page.tsx src/components/pages/users/users-page.tsx src/app/(dashboard)/admin src/components/dashboards/real-estate src/components/dashboards/default`

Expected: PASS.

Run: `npm.cmd --prefix web run test -- src/lib/protected-api.test.ts`

Expected: PASS.

- [ ] **Step 5: 커밋하고 푸시한다.**

```powershell
git add web/src/components/pages/settings web/src/components/pages/users web/src/app/(dashboard)/admin web/src/app/(dashboard)/users web/src/components/dashboards/real-estate web/src/components/dashboards/default
git commit -m "refactor(web): align administration pages with light ui"
git push
```

### Task 7: 대시보드 및 잔여 제품 화면 일괄 전환

**Files:**
- Modify: `web/src/components/dashboards/analytics/`
- Modify: `web/src/components/dashboards/{academy,crm,ecommerce,file-manager,finance,hotel,hospital,payment,project-management,crypto,sales}/`
- Modify: `web/src/app/(dashboard)/error/`
- Modify: `web/src/app/not-found.tsx`
- Test: `web/src/app/globals.test.ts`

**Interfaces:**
- Consumes: Task 2 토큰과 공통 UI.
- Produces: 모든 대시보드, 오류, not-found 화면에서 다크 변형·임의 surface 색상을 사용하지 않는 상태.

- [ ] **Step 1: 대시보드 디렉터리의 다크 변형 탐지 테스트를 작성한다.**

```ts
for (const file of dashboardFiles) {
  expect(readFileSync(file, "utf8")).not.toContain("dark:")
}
```

- [ ] **Step 2: 테스트가 현재 대시보드 템플릿의 `dark:` 사용에서 실패하는지 확인한다.**

Run: `npm.cmd --prefix web run test -- src/app/globals.test.ts`

Expected: FAIL until the bounded dashboard file list is migrated.

- [ ] **Step 3: 대시보드 surface와 차트를 semantic token으로 전환한다.**

```tsx
className="rounded-xl border border-border bg-card text-card-foreground"
```

각 대시보드 디렉터리에서 `dark:` 접두사와 임의 dark hex 색상을 제거하고, 카드·표·badge·chart tooltip을 `background`, `card`, `muted`, `foreground` 토큰으로 맞춘다. 차트 데이터와 계산 로직은 변경하지 않는다.

- [ ] **Step 4: 전체 대시보드 정적 검사와 lint를 실행한다.**

Run: `rg -n "dark:" web/src/components/dashboards web/src/app/(dashboard)/error web/src/app/not-found.tsx`

Expected: no output.

Run: `npm.cmd --prefix web run lint -- src/components/dashboards src/app/(dashboard)/error src/app/not-found.tsx`

Expected: PASS.

- [ ] **Step 5: 커밋하고 푸시한다.**

```powershell
git add web/src/components/dashboards web/src/app/(dashboard)/error web/src/app/not-found.tsx web/src/app/globals.test.ts
git commit -m "refactor(web): migrate dashboards to light tokens"
git push
```

### Task 8: 앱, 컴포넌트 카탈로그, 블록, 템플릿 전환

**Files:**
- Modify: `web/src/components/apps/`
- Modify: `web/src/components/pages/components-*/`
- Modify: `web/src/app/(dashboard)/apps/`
- Modify: `web/src/app/(dashboard)/components/`
- Modify: `web/src/app/(dashboard)/blocks/`
- Modify: `web/src/app/(dashboard)/templates/`
- Modify: `web/src/app/(dashboard)/widgets/`
- Modify: `web/src/app/(dashboard)/examples/page.tsx`
- Test: `web/src/app/globals.test.ts`

**Interfaces:**
- Consumes: Tasks 2-3의 공통 UI 계약.
- Produces: 번들에 포함된 앱·카탈로그·데모도 라이트 토큰을 따르며, 폼 예제는 `Field`/`FormField`의 올바른 사용법을 보여 주는 상태.

- [ ] **Step 1: 앱과 데모 디렉터리의 다크 변형 탐지 테스트를 확장한다.**

```ts
for (const file of appAndDemoFiles) {
  expect(readFileSync(file, "utf8")).not.toContain("dark:")
}
```

- [ ] **Step 2: 테스트가 남아 있는 다크 변형에서 실패하는지 확인한다.**

Run: `npm.cmd --prefix web run test -- src/app/globals.test.ts`

Expected: FAIL until the configured app and demo directories are migrated.

- [ ] **Step 3: 데모 화면을 공통 UI 규칙으로 전환한다.**

```tsx
<FieldGroup className="max-w-md">
  <FormField label="예시 입력" htmlFor="example-input">
    <Input id="example-input" />
  </FormField>
</FieldGroup>
```

`apps`, `components`, `blocks`, `templates`, `widgets`, `examples`에서 색상과 밀도를 common token으로 바꾸고, 폼 데모는 `FormField`를 사용한다. 기능 데모의 데이터, drag-and-drop, editor, calendar 동작은 유지한다.

- [ ] **Step 4: 잔여 테마 탐지와 lint를 실행한다.**

Run: `rg -n "dark:|ThemeProvider|ThemeToggle" web/src/app web/src/components`

Expected: no output except intentionally documented migration exclusions, which must be removed before this task is committed.

Run: `npm.cmd --prefix web run lint -- src/components/apps src/components/pages src/app/(dashboard)/apps src/app/(dashboard)/components src/app/(dashboard)/blocks src/app/(dashboard)/templates src/app/(dashboard)/widgets src/app/(dashboard)/examples/page.tsx`

Expected: PASS.

- [ ] **Step 5: 커밋하고 푸시한다.**

```powershell
git add web/src/components/apps web/src/components/pages web/src/app/(dashboard)/apps web/src/app/(dashboard)/components web/src/app/(dashboard)/blocks web/src/app/(dashboard)/templates web/src/app/(dashboard)/widgets web/src/app/(dashboard)/examples/page.tsx web/src/app/globals.test.ts
git commit -m "refactor(web): migrate apps and templates to light ui"
git push
```

### Task 9: 전체 검증과 변경 기록

**Files:**
- Modify: `docs/overview/phase-60-light-only-ui-system.md`
- Modify: `docs/overview/cloudflare-browser-testing.md`

**Interfaces:**
- Consumes: Tasks 1-8의 구현과 테스트.
- Produces: 원인, 변경 내용, 자동·수동 검증 결과와 남은 제약을 기록한 완료 문서.

- [ ] **Step 1: 전체 라이트 전용 검사 실패 조건을 확인한다.**

```powershell
rg -n "ThemeProvider|ThemeToggle|next-themes|dark:" web/src web/package.json
```

Expected: no output.

- [ ] **Step 2: 전체 단위 테스트를 실행한다.**

Run: `npm.cmd --prefix web run test -- src/app/layout.test.ts src/app/globals.test.ts src/components/ui/field.test.tsx src/app/(dashboard)/forms-layout.test.ts src/lib/property-mutation.test.ts src/lib/tenant-mutation.test.ts src/lib/contract-mutation.test.ts src/lib/protected-api.test.ts`

Expected: PASS. Playwright spec 수집 문제로 전체 `npm run test`가 실패하면, 해당 사실과 별도 `npm.cmd --prefix web run test:e2e` 결과를 문서에 정확히 기록한다.

- [ ] **Step 3: 프로덕션 빌드와 lint를 실행한다.**

Run: `npm.cmd --prefix web run lint`

Expected: PASS.

Run: `npm.cmd --prefix web run build`

Expected: PASS.

- [ ] **Step 4: Cloudflare Tunnel 브라우저 점검을 수행한다.**

Run: `https://mnre.approid.team/`, `/properties`, `/tenants`, `/contracts`, `/payments`, `/maintenance`, `/inspections`, `/settings`, `/admin/users`

Expected: 모든 화면이 라이트 테마이며, 폼·날짜·native select 목록이 읽기 쉽고 등록·수정과 Auth0 로그인·로그아웃이 정상 동작.

- [ ] **Step 5: 검증 결과를 한국어 문서에 기록한다.**

```markdown
## 검증 결과

- 자동: `npm.cmd --prefix web run test -- ...` 통과
- 정적: `rg -n "ThemeProvider|ThemeToggle|next-themes|dark:" web/src web/package.json` 결과 없음
- 브라우저: Cloudflare Tunnel에서 관리 폼, native select, Auth0 흐름 확인
```

- [ ] **Step 6: 문서를 커밋하고 푸시한다.**

```powershell
git add docs/overview/phase-60-light-only-ui-system.md docs/overview/cloudflare-browser-testing.md
git commit -m "docs: record light-only ui verification"
git push
```
