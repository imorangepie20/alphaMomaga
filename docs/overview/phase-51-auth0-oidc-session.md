# Phase 51: Auth0 OIDC Session

## 변경 이유

Auth0가 access token에 역할을 기본 `role` claim으로 넣지 않으므로, 기존 API는 Auth0에서 검증된 token도 역할 주체로 인식하지 못했습니다. 이 문제는 property, tenant, contract, payment, maintenance 업무 흐름의 보호된 요청이 유효한 Auth0 사용자에게도 `401`로 거부될 수 있게 했습니다.

## 변경 내용

- `AuthenticatedPrincipal`은 현재 단일 역할만 나타내므로 API는 `https://alpha-momega.app/role` namespaced claim에서 `Admin`, `PropertyManager`, `Finance`, `Inspector` 중 정확히 하나의 서로 다른 허용 역할만 수락합니다. 같은 허용 역할의 중복은 수락하지만 서로 다른 허용 역할이 둘 이상이면 token을 거부합니다.
- claim이 없거나 배열이 아니거나 허용되지 않은 역할만 있으면 기존 `UnauthorizedException('The token principal is invalid')` 동작을 유지합니다.
- `api/.env.example`은 Auth0 domain과 API identifier를 위한 비밀값 없는 placeholder를 제공합니다.
- `web/`은 `@auth0/nextjs-auth0` 서버 SDK와 `src/proxy.ts`로 `/auth/login`, `/auth/callback`, `/auth/logout`을 처리합니다. dashboard layout은 서버에서만 session을 확인하고, header에는 사용자 표시 정보만 전달합니다.
- `web/src/app/api/proxy/[resource]/route.ts`와 `web/src/app/api/proxy/[resource]/[id]/route.ts`는 `properties`, `tenants`, `contracts`, `payments`, `maintenance`, `inspections`의 `POST`, `PUT`, `DELETE`만 전달합니다. item route는 `PUT`, `DELETE`를 API의 `/:id` endpoint로 전달합니다. 수신된 cookie와 Authorization header는 전달하지 않으며, 서버 session에서 얻은 Access Token과 `content-type`만 새 요청에 구성합니다.

## Auth0 배포 계약

Auth0 Dashboard에서 다음 Post Login Action을 배포한 뒤 `Actions > Flows > Login`에 연결해야 합니다. 이 Action은 Auth0 authorization roles를 API가 검증하는 namespaced access-token claim으로 전달합니다.

```js
exports.onExecutePostLogin = async (event, api) => {
  const roles = event.authorization?.roles ?? [];
  api.accessToken.setCustomClaim('https://alpha-momega.app/role', roles);
};
```

배포 환경에는 `AUTH_JWKS_URL`, `AUTH_ISSUER`, `AUTH_AUDIENCE`를 실제 Auth0 tenant 및 API 설정으로 지정하고 `AUTH_ALLOW_DEMO_ROLE=false`를 유지합니다. `YOUR_AUTH0_DOMAIN`은 `dev-u1feezhev3peemey.us.auth0.com`처럼 `.auth0.com`을 포함한 완전한 Auth0 host 이름이어야 합니다. 따라서 JWKS URL은 `https://<AUTH0_DOMAIN>/.well-known/jwks.json`, issuer는 `https://<AUTH0_DOMAIN>/` 형식을 사용합니다.

여러 역할을 가진 사용자를 지원하려면 향후 `AuthenticatedPrincipal`을 role-set으로 확장하고 권한 검사를 그 계약에 맞게 변경해야 합니다. 그 전까지 Auth0 역할 할당은 허용 역할 하나만 포함해야 합니다.

## 검증

`npm.cmd --prefix api run test -- src/auth/auth0-role.spec.ts src/auth/auth.service.spec.ts`로 namespaced role 선택과 기존 bearer-token 거부 동작을 검증합니다.

2026-09-03 검증 결과:

- `npm.cmd --prefix api run test`: 130 tests passed.
- `npm.cmd --prefix web run test -- src/lib/protected-api.test.ts`: 6 tests passed. 서버-side Bearer token 전달, session 부재 `401`, 허용되지 않은 method `405`, API origin 부재 `503`, resource allowlist, item endpoint 전달을 확인했습니다.
- `web/node_modules/.bin/tsc.cmd --noEmit --project web/tsconfig.json`: passed.
- `npm.cmd --prefix web run build`: passed. Next.js production build에서 Proxy가 등록되었습니다.
- `npm.cmd --prefix web run lint`: exit 0. 변경 범위 밖 기존 warning 59개가 남아 있습니다.
- `npm.cmd --prefix web run test:e2e -- e2e/auth-session.spec.ts`: Chromium에서 unauthenticated `/properties` 접근이 `/login`으로 redirect되는 것을 확인했습니다.

현재 설치된 `@auth0/nextjs-auth0` `4.28.0`은 signed test session을 생성하는 공개 `./testing` export를 제공하지 않습니다. 따라서 authenticated Playwright suite는 SDK가 해당 공개 API를 제공하는 버전으로 올린 후 추가합니다. SDK의 비공개 cookie 암호화 구현을 복사하거나 인증 우회 endpoint를 만드는 방식은 사용하지 않습니다. 미인증 dashboard redirect는 `web/e2e/auth-session.spec.ts`로 검증합니다.

## 운영 확인

`web/.env.local`의 `APP_BASE_URL`, `AUTH0_DOMAIN`, `AUTH0_CLIENT_ID`, `AUTH0_CLIENT_SECRET`, `AUTH0_SECRET`, `AUTH0_AUDIENCE`를 설정한 뒤, Auth0 Dashboard의 Allowed Callback URLs와 Allowed Logout URLs에 `http://localhost:3001` 및 `https://mnre.approid.team` 경로를 유지합니다. Access Token, Client Secret, session secret은 문서, source, browser response에 기록하지 않습니다.
