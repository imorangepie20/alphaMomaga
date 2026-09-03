# Auth0 OIDC Session Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Auth0 Universal Login, server-held web sessions, and namespaced Access Token role claims protect the administrator dashboard and future API mutations.

**Architecture:** `web/` uses `@auth0/nextjs-auth0` for Authorization Code + PKCE and encrypted HttpOnly sessions. The dashboard checks its session in a Server Component. A narrow Next.js Route Handler obtains the server-side token and proxies selected mutations to `api/`, where NestJS validates Auth0 JWTs and existing RBAC.

**Tech Stack:** Next.js 16, React 19, `@auth0/nextjs-auth0`, NestJS 12, `jose`, Vitest, Playwright, Auth0 Actions.

**Spec:** `docs/superpowers/specs/2026-09-03-auth0-oidc-session-design.md`

## Global Constraints

- Never commit a Client Secret, session secret, or Access Token.
- Use `https://api.approid.team/` for both `AUTH0_AUDIENCE` and `AUTH_AUDIENCE`.
- Use `https://alpha-momega.app/role` as the Auth0 Access Token claim.
- Permit only `Admin`, `PropertyManager`, `Finance`, and `Inspector`.
- Preserve public read API behavior, dashboard styling, and the domain workflow.
- Do not expose tokens to browser JavaScript or localStorage.

---

### Task 1: Accept Auth0 Namespaced Roles in the API

**Files:**
- Create: `api/src/auth/auth0-role.ts`
- Create: `api/src/auth/auth0-role.spec.ts`
- Modify: `api/src/auth/auth.service.ts`
- Modify: `api/.env.example`
- Create: `docs/overview/phase-51-auth0-oidc-session.md`

**Interfaces:**
- Consumes: `JWTPayload` and `RoleName`.
- Produces: `getAuth0Role(payload: JWTPayload): RoleName | null`.

- [ ] **Step 1: Write the failing test**

```ts
import { describe, expect, it } from 'vitest';
import { getAuth0Role } from './auth0-role.js';

describe('getAuth0Role', () => {
  it('returns the first allowed namespaced Auth0 role', () => {
    expect(getAuth0Role({ 'https://alpha-momega.app/role': ['Admin'] })).toBe('Admin');
  });

  it('returns null for missing and unapproved roles', () => {
    expect(getAuth0Role({})).toBeNull();
    expect(getAuth0Role({ 'https://alpha-momega.app/role': ['Owner'] })).toBeNull();
  });
});
```

- [ ] **Step 2: Verify RED**

Run: `npm.cmd --prefix api run test -- src/auth/auth0-role.spec.ts`

Expected: FAIL because `getAuth0Role` does not exist.

- [ ] **Step 3: Implement the minimum helper**

```ts
const claimName = 'https://alpha-momega.app/role';
const allowedRoles: RoleName[] = ['Admin', 'PropertyManager', 'Finance', 'Inspector'];

export function getAuth0Role(payload: JWTPayload): RoleName | null {
  const roles = payload[claimName];
  if (!Array.isArray(roles)) return null;
  return roles.find((value): value is RoleName =>
    typeof value === 'string' && allowedRoles.includes(value as RoleName),
  ) ?? null;
}
```

Update `AuthService.verifyBearerToken` to use the helper after `jwtVerify` and retain its existing `UnauthorizedException` behavior.

- [ ] **Step 4: Verify GREEN**

Run: `npm.cmd --prefix api run test -- src/auth/auth0-role.spec.ts src/auth/auth.service.spec.ts`

Expected: PASS.

- [ ] **Step 5: Document the deployment contract**

Add non-secret Auth0 placeholders to `api/.env.example`. In `phase-51-auth0-oidc-session.md`, document this deployed Post Login Action and that it must be attached to `Actions > Flows > Login`:

```js
exports.onExecutePostLogin = async (event, api) => {
  const roles = event.authorization?.roles ?? [];
  api.accessToken.setCustomClaim('https://alpha-momega.app/role', roles);
};
```

- [ ] **Step 6: Commit**

```bash
git add api/src/auth/auth0-role.ts api/src/auth/auth0-role.spec.ts api/src/auth/auth.service.ts api/.env.example docs/overview/phase-51-auth0-oidc-session.md
git commit -m "feat(api): accept Auth0 namespaced roles"
```

### Task 2: Add Auth0 Server Sessions and Dashboard Control

**Files:**
- Modify: `web/package.json`
- Modify: `web/package-lock.json`
- Create: `web/src/lib/auth0.ts`
- Create: `web/src/proxy.ts`
- Create: `web/src/lib/require-session.ts`
- Create: `web/src/lib/require-session.test.ts`
- Modify: `web/src/app/(dashboard)/layout.tsx`
- Modify: `web/src/app/(auth)/login/page.tsx`
- Modify: `web/src/components/layout/app-header.tsx`
- Modify: `web/.env.example`

**Interfaces:**
- Consumes: Auth0 server environment variables and the Next.js `src/proxy.ts` Auth0 integration.
- Produces: `auth0` singleton and `requireSession(): Promise<SessionData>`.

- [ ] **Step 1: Add failing session tests**

```ts
it('redirects unauthenticated requests to login', async () => {
  mockGetSession.mockResolvedValue(null);
  await expect(requireSession()).rejects.toThrow('/login');
});

it('returns an authenticated session', async () => {
  mockGetSession.mockResolvedValue({ user: { sub: 'auth0|admin' } });
  await expect(requireSession()).resolves.toMatchObject({ user: { sub: 'auth0|admin' } });
});
```

- [ ] **Step 2: Verify RED**

Run: `npm.cmd --prefix web run test -- src/lib/require-session.test.ts`

Expected: FAIL because the test script and helper are absent.

- [ ] **Step 3: Install and configure packages**

```bash
npm.cmd --prefix web install @auth0/nextjs-auth0
npm.cmd --prefix web install --save-dev vitest
```

Create `auth0.ts` using the installed SDK's Next.js 16 App Router API:

```ts
import { Auth0Client } from '@auth0/nextjs-auth0/server';

export const auth0 = new Auth0Client({
  authorizationParameters: { audience: process.env.AUTH0_AUDIENCE },
});
```

Implement `requireSession` with `auth0.getSession()`; redirect only when it returns `null`.

Add `src/proxy.ts` using the Auth0 SDK integration required for Next.js 16 so its automatically mounted `/auth/*` routes, including `/auth/login`, `/auth/callback`, and `/auth/logout`, are handled correctly.

- [ ] **Step 4: Protect and connect the UI**

Make the dashboard layout async and call `await requireSession()` before rendering the existing sidebar tree. Replace the inactive email/password and social controls with one accessible `Continue with Auth0` link to `/auth/login`. Update `AppHeader` to display session user information and an accessible `/auth/logout` link without rendering a token.

Extend `web/.env.example` with all Auth0 variable names, `APP_BASE_URL=http://localhost:3001`, and `openssl rand -hex 32`. Do not edit `web/.env.local`.

- [ ] **Step 5: Verify GREEN**

Run: `npm.cmd --prefix web run test -- src/lib/require-session.test.ts`

Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add web/package.json web/package-lock.json web/src/lib/auth0.ts web/src/proxy.ts web/src/lib/require-session.ts web/src/lib/require-session.test.ts web/src/app/(dashboard)/layout.tsx web/src/app/(auth)/login/page.tsx web/src/components/layout/app-header.tsx web/.env.example
git commit -m "feat(web): add Auth0 dashboard sessions"
```

### Task 3: Add a Narrow Server-only Mutation Proxy

**Files:**
- Create: `web/src/lib/protected-api.ts`
- Create: `web/src/lib/protected-api.test.ts`
- Create: `web/src/app/api/proxy/[resource]/route.ts`

**Interfaces:**
- Consumes: `auth0.getAccessToken()`, `getApiUrl()`, and `ProtectedResource`.
- Produces: `forwardProtectedMutation(resource: ProtectedResource, request: Request): Promise<Response>`.

- [ ] **Step 1: Write failing proxy tests**

```ts
it('forwards the server-side Bearer token', async () => {
  mockGetAccessToken.mockResolvedValue({ token: 'access-token' });
  await forwardProtectedMutation('properties', new Request('https://web.test/api/proxy/properties', {
    method: 'POST', body: '{"name":"New Property"}', headers: { 'content-type': 'application/json' },
  }));
  expect(mockFetch).toHaveBeenCalledWith('https://api.approid.team/properties', expect.objectContaining({
    headers: expect.objectContaining({ authorization: 'Bearer access-token' }),
  }));
});

it('returns 401 without a session token', async () => {
  mockGetAccessToken.mockResolvedValue(null);
  expect((await forwardProtectedMutation('properties', new Request('https://web.test'))).status).toBe(401);
});
```

- [ ] **Step 2: Verify RED**

Run: `npm.cmd --prefix web run test -- src/lib/protected-api.test.ts`

Expected: FAIL because the proxy helper is absent.

- [ ] **Step 3: Implement the allowlisted BFF**

Use a `ProtectedResource` literal union for `properties`, `tenants`, `contracts`, `payments`, `maintenance`, and `inspections`. Allow only `POST`, `PUT`, and `DELETE`; return `404` for an unknown resource and `405` for another method. Return `401` without a server-side token and `503` without an API origin.

Forward only `content-type` and a constructed `Authorization: Bearer <token>` header. The Route Handler delegates to this helper and never forwards incoming authorization or cookie headers.

- [ ] **Step 4: Verify GREEN**

Run: `npm.cmd --prefix web run test -- src/lib/protected-api.test.ts`

Expected: PASS for token forwarding, `401`, `404`, and `405`.

- [ ] **Step 5: Commit**

```bash
git add web/src/lib/protected-api.ts web/src/lib/protected-api.test.ts web/src/app/api/proxy/[resource]/route.ts
git commit -m "feat(web): proxy protected API mutations"
```

### Task 4: Browser Coverage and Auth0 Deployment Verification

**Files:**
- Create: `web/e2e/auth-session.spec.ts`
- Modify: `web/playwright.config.ts`
- Modify: `docs/overview/phase-51-auth0-oidc-session.md`
- Modify: `docs/architecture/web-auth-boundary.md`

**Interfaces:**
- Consumes: login page, dashboard session boundary, and a Playwright-only test environment.
- Produces: deterministic regression tests plus documented local and Cloudflare verification.

- [ ] **Step 1: Write failing browser tests**

```ts
test('login starts Auth0 authorization', async ({ page }) => {
  await page.goto('/login');
  await expect(page.getByRole('link', { name: 'Continue with Auth0' }))
    .toHaveAttribute('href', '/auth/login');
});

test('dashboard redirects to login without a session', async ({ page }) => {
  await page.goto('/properties');
  await expect(page).toHaveURL(/\/login$/);
});
```

- [ ] **Step 2: Verify RED**

Run: `npm.cmd --prefix web run test:e2e -- e2e/auth-session.spec.ts`

Expected: FAIL because login and session protection do not exist.

- [ ] **Step 3: Preserve existing browser suites safely**

Use the Auth0 SDK test utility to generate a signed `appSession` cookie for a synthetic session. Configure authenticated Playwright projects to load that storage state, and run `auth-session.spec.ts` in a separate unauthenticated project. The helper must not be imported by runtime code or included in production bundles; do not add a runtime authentication-bypass environment variable.

- [ ] **Step 4: Verify all automated checks**

```bash
npm.cmd --prefix web run test:e2e -- e2e/auth-session.spec.ts
npm.cmd --prefix web run lint
npm.cmd --prefix web run test
npm.cmd --prefix web run build
npm.cmd --prefix api run test
```

Expected: all listed checks pass.

- [ ] **Step 5: Verify Auth0 manually and update docs**

With an Auth0 user assigned `Admin`, verify login, dashboard access, and logout at `http://localhost:3001`, then repeat at `https://mnre.approid.team`. Call `GET https://api.approid.team/auth/me` using the session-derived Access Token and verify role `Admin`. Record results in phase 51 and replace the pre-implementation status in `web-auth-boundary.md`.

- [ ] **Step 6: Commit**

```bash
git add web/e2e/auth-session.spec.ts web/playwright.config.ts docs/overview/phase-51-auth0-oidc-session.md docs/architecture/web-auth-boundary.md
git commit -m "test(web): verify Auth0 session boundary"
```

## Plan Self-Review

- Spec coverage: Task 1 implements Auth0 claim validation; Task 2 implements Universal Login, server sessions, protected dashboard, and logout; Task 3 creates the BFF token boundary; Task 4 covers regression, Cloudflare, and documentation verification.
- Placeholder scan: every task names concrete files, interfaces, tests, and commands.
- Type consistency: `getAuth0Role` returns `RoleName | null`; `requireSession` supplies the dashboard session; `forwardProtectedMutation` is the only proxy helper used by the Route Handler.
