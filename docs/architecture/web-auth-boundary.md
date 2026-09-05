# Web 인증 경계

## 현재 구조

### 2026-09-05 인증 경로 브라우저 이동 수정

- 원인: 로그인·로그아웃과 인증 오류 안내 6곳이 Next.js `Link`를 사용했다.
  `/auth/login`은 Auth0 외부 인증 흐름으로 redirect하는 경로이지 RSC 페이지가 아니므로
  사전 불러오기 또는 클라이언트 이동에서 `Failed to fetch RSC payload`가 발생할 수 있었다.
- 변경: 인증 경로 링크는 일반 `<a>`로 바꿔 전체 브라우저 이동을 사용한다.
  SDK의 설치된 `@auth0/nextjs-auth0/README.md`도 이 방식을 명시한다.
- 검증: 변경 전 재현된 소스 회귀 검사 6건을 포함해 웹 134개 테스트와 변경 파일 린트 통과.
  인증된 브라우저에서 로그인 왕복 수동 검증은 미실행이다.
- API 권한, Auth0 자격 증명, Cloudflare 설정은 변경하지 않았다.

`web/`은 `@auth0/nextjs-auth0`를 사용해 Auth0 Universal Login의 Authorization Code + PKCE 흐름을 처리한다. browser JavaScript는 Access Token, Client Secret, session secret을 읽거나 저장하지 않는다.

- `web/src/proxy.ts`가 Next.js 16 Proxy에서 Auth0 SDK middleware를 실행한다.
- Auth0 SDK는 `/auth/login`, `/auth/callback`, `/auth/logout` route를 처리하고 encrypted HttpOnly session cookie를 관리한다.
- dashboard layout은 Server Component에서 `requireSession()`을 호출한다. session이 없으면 `/login`으로 redirect한다.
- header는 session의 사용자 표시 정보만 받아 표시하며 token을 렌더링하지 않는다.

## 환경 계약

`web/.env.local`에는 다음 server-only 값을 설정한다. 실제 값은 Git이나 문서에 기록하지 않는다.

```text
APP_BASE_URL=https://mnre.approid.team
AUTH0_DOMAIN=<AUTH0_DOMAIN>
AUTH0_CLIENT_ID=<AUTH0_CLIENT_ID>
AUTH0_CLIENT_SECRET=<AUTH0_CLIENT_SECRET>
AUTH0_AUDIENCE=https://api.approid.team/
AUTH0_SECRET=<SESSION_SECRET>
```

Auth0 API Resource Server Identifier와 `AUTH0_AUDIENCE`는 마지막 `/`까지 `https://api.approid.team/`로 일치해야 한다. 현재 Regular Web Application에는 해당 API의 User-Delegated Access가 부여되어야 한다.

## API 인증 계약

`api/`는 Auth0 JWKS를 사용해 RS256 Access Token의 issuer와 audience를 검증한다. Post Login Action은 Access Token에 `https://alpha-momega.app/role` claim을 기록한다.

- 허용 역할: `Admin`, `PropertyManager`, `Finance`, `Inspector`
- `AuthenticatedPrincipal`은 단일 역할 모델이므로 서로 다른 허용 역할이 둘 이상인 token은 거부한다.
- claim 누락, 허용되지 않은 역할, 잘못된 audience는 `401`이다.
- 인증은 성공했지만 권한이 부족한 쓰기 작업은 기존 RBAC 정책에 따라 `403`이다.

## BFF 변경 요청 경계

browser는 API Access Token을 직접 사용하지 않는다. `web/src/app/api/proxy/` route는 server session에서 얻은 Access Token만으로 API 변경 요청을 전달한다.

- 허용 resource: `properties`, `tenants`, `contracts`, `payments`, `maintenance`, `inspections`
- collection route는 `POST`를 전달한다.
- item route는 `PUT`, `DELETE`를 API의 `/:id` endpoint로 전달한다.
- 수신한 `cookie`, `Authorization` header는 API로 전달하지 않는다.
- API origin이 없으면 `503`, session token이 없으면 `401`, 허용되지 않은 resource는 `404`, 허용되지 않은 method는 `405`를 반환한다.

이 경계는 `property -> tenant -> contract -> payment -> maintenance` 업무 흐름의 변경 API가 동일한 서버 측 인증 계약을 사용하도록 보장한다.

## Cloudflare 검증 경계

- 관리자 UI: `https://mnre.approid.team/` -> `http://localhost:3001`
- API: `https://api.approid.team/` -> `http://localhost:3100`
- API bootstrap 기본 포트는 `3100`이며, 명시된 `PORT` 환경 변수는 우선한다.

자세한 origin 실행과 `502` 진단 절차는 `docs/overview/cloudflare-browser-testing.md`를 따른다.

## 검증 상태

- Auth0 API Resource Server와 User-Delegated Access 설정 후 `/auth/login`은 Auth0 tenant의 Universal Login route로 이동한다.
- Google 로그인 provider가 Auth0 Universal Login에서 동작하는 것을 수동 확인했다.
- unauthenticated `/properties` 접근은 Playwright에서 `/login` redirect를 확인한다.
- BFF mutation helper는 token 전달, `401`, `404`, `405`, `503`, item endpoint 전달을 unit test로 확인한다.

현재 `@auth0/nextjs-auth0` `4.28.0`에는 signed test session을 만드는 공개 testing export가 없다. 따라서 authenticated browser suite는 SDK의 공개 API가 제공될 때 추가한다. 비공개 cookie 암호화 구현 복사, test login endpoint, runtime bypass 환경 변수는 만들지 않는다.
