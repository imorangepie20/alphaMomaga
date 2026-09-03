# Auth0 OIDC 세션 설계

## 목적

`web/`의 형식적인 로그인 화면을 Auth0 Universal Login 기반의 실제 OIDC
로그인으로 전환한다. 로그인된 사용자는 서버 세션으로 대시보드에 접근하며,
보호된 API에는 서버가 획득한 Access Token만 Bearer 인증으로 전달한다.

## 확정된 전제

- 인증 제공자는 Auth0이며, 애플리케이션 유형은 Regular Web Application이다.
- 웹 기준 주소는 `https://mnre.approid.team`이고 로컬 개발 주소는
  `http://localhost:3001`이다.
- API audience는 `https://api.approid.team/`이다.
- 최초 관리 사용자의 역할은 `Admin`이다.
- Auth0 Application에는 `/auth/callback` callback, logout, web origin URL이
  로컬 및 Cloudflare 주소로 등록되어 있다.
- `web/.env.local`에는 Auth0 SDK가 요구하는 비밀 설정이 저장되어 있으며,
  이 문서와 Git에는 비밀값을 기록하지 않는다.

## 선택한 구조

Next.js에 `@auth0/nextjs-auth0` SDK를 사용한다. Auth0 SDK의 `/auth/login`,
`/auth/callback`, `/auth/logout` 경로가 Authorization Code Flow + PKCE 및
HttpOnly 세션 쿠키를 처리한다. 이메일과 비밀번호를 직접 받는 기존 로그인
폼은 Auth0 로그인 시작 버튼으로 대체한다.

대시보드 layout은 서버에서 세션을 확인한다. 세션이 없으면 `/login`으로
redirect하고, 세션이 있으면 기존 dashboard UI를 렌더링한다. Access Token은
브라우저 JavaScript 또는 localStorage에 노출하지 않는다.

보호된 API 호출이 필요한 경우 Next.js Route Handler가 세션에서 Access Token을
가져와 `Authorization: Bearer <token>` 헤더를 붙여 API에 전달한다. 이 BFF
경계는 향후 Property 생성, 수정, 삭제 UI에서 재사용한다. 현재 공개 조회 API의
기존 서버 렌더링 데이터 흐름은 변경하지 않는다.

## API 인증 계약

NestJS는 Auth0 공개 JWKS를 사용해 RS256 Access Token의 issuer와 audience를
검증한다.

```text
AUTH_JWKS_URL=https://<AUTH0_DOMAIN>/.well-known/jwks.json
AUTH_ISSUER=https://<AUTH0_DOMAIN>/
AUTH_AUDIENCE=https://api.approid.team/
AUTH_ALLOW_DEMO_ROLE=false
```

프로덕션 API 실행 환경에 위 값을 주입한다. `api/.env.example`에는 변수 이름과
형식만 유지하며 실제 값과 Auth0 Client Secret은 기록하지 않는다.

Auth0 Access Token에는 표준 `role` claim을 추가할 수 없으므로 Post Login
Action이 namespaced claim `https://alpha-momega.app/role`에 Auth0 역할을
기록한다. API는 이 claim이 `Admin`, `PropertyManager`, `Finance`, `Inspector`
중 하나인지 검증해 기존 `AuthenticatedPrincipal`로 변환한다. claim이 없거나
허용되지 않은 역할이면 `401`을 반환한다. 권한과 맞지 않는 보호 작업은 기존
RBAC 규칙에 따라 `403`을 반환한다.

## Auth0 Dashboard 수동 설정

1. `Applications > APIs`에서 Identifier가 `https://api.approid.team/`인 API를
   생성한다.
2. `User Management > Roles`에서 `Admin` 역할을 생성하고 최초 사용자에게
   할당한다.
3. `Actions > Flows > Login`에 Post Login Action을 추가한다.
4. Action은 Access Token에 `https://alpha-momega.app/role` claim을 설정한다.
5. Action을 Login flow에 배포한다.

Action 구현은 Auth0 역할 배열에서 첫 번째 허용 역할을 선택하며, 역할이 없으면
claim을 추가하지 않는다. 따라서 API가 임의의 기본 관리자 권한을 부여하지
않는다.

## 오류 처리

- Auth0 로그인 실패 또는 callback 오류는 `/login`으로 돌아가 사용자에게
  재시도 안내를 표시한다.
- 세션 없는 dashboard 접근은 `/login`으로 redirect한다.
- BFF Route Handler는 API의 `401`과 `403`을 그대로 반환한다.
- BFF는 API Access Token, Client Secret, 세션 내용을 응답 또는 로그에
  포함하지 않는다.

## 테스트와 검증

- 로그인 화면이 Auth0 로그인 시작 경로를 제공하는지 검증한다.
- 세션이 없으면 dashboard layout이 `/login`으로 redirect하는지 검증한다.
- Auth0 Access Token의 namespaced `Admin` claim이 API principal로 변환되는지
  API 단위 테스트로 검증한다.
- claim 없음, 허용되지 않은 역할, 잘못된 audience가 `401`인지 검증한다.
- BFF Route Handler가 세션 Access Token을 API Bearer 헤더로 전달하는지
  검증한다.
- `npm.cmd --prefix web run lint`, `npm.cmd --prefix web run build`,
  `npm.cmd --prefix api run test`를 실행한다.
- Auth0 계정으로 `http://localhost:3001`과 `https://mnre.approid.team`에서
  로그인, dashboard 접근, 로그아웃을 수동 검증한다.

## 범위 제외

- 다중 테넌트와 조직 단위 SSO
- Refresh Token Rotation 설정 변경
- 신규 사용자 자체 가입 및 비밀번호 재설정 UI
- 모든 기존 공개 조회 API의 보호 API 전환
