# Phase 51: Auth0 OIDC Session

## 변경 이유

Auth0가 access token에 역할을 기본 `role` claim으로 넣지 않으므로, 기존 API는 Auth0에서 검증된 token도 역할 주체로 인식하지 못했습니다. 이 문제는 property, tenant, contract, payment, maintenance 업무 흐름의 보호된 요청이 유효한 Auth0 사용자에게도 `401`로 거부될 수 있게 했습니다.

## 변경 내용

- `AuthenticatedPrincipal`은 현재 단일 역할만 나타내므로 API는 `https://alpha-momega.app/role` namespaced claim에서 `Admin`, `PropertyManager`, `Finance`, `Inspector` 중 정확히 하나의 서로 다른 허용 역할만 수락합니다. 같은 허용 역할의 중복은 수락하지만 서로 다른 허용 역할이 둘 이상이면 token을 거부합니다.
- claim이 없거나 배열이 아니거나 허용되지 않은 역할만 있으면 기존 `UnauthorizedException('The token principal is invalid')` 동작을 유지합니다.
- `api/.env.example`은 Auth0 domain과 API identifier를 위한 비밀값 없는 placeholder를 제공합니다.

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
