# Auth0 Management API 연결

## 구조

`/admin/users` 서버 페이지는 로그인 사용자의 `user:manage`를 확인한 뒤 Nest API로
사용자 조회를 요청한다. 변경은 동일 출처의 `/api/admin-users/[...path]` BFF를 통한다.
서버 세션 토큰만 Nest로 전달하고 M2M Client Secret 및 Management 토큰은 API 프로세스에만 둔다.

Nest의 `AdminUsersModule`은 `AuthGuard`, `PermissionsGuard`를 적용한다.
각 요청은 Auth0에서 요청자의 현재 차단 여부와 `Admin` 역할도 재확인한다.
만료되지 않은 과거 관리자 JWT만으로 사용자 관리를 계속할 수 없다.

## 서버 설정

`api/.env`에 아래 항목을 설정한다. 비밀값은 Git·브라우저·로그·채팅에 넣지 않는다.

```dotenv
AUTH0_MANAGEMENT_DOMAIN=YOUR_TENANT.us.auth0.com
AUTH0_MANAGEMENT_CLIENT_ID=
AUTH0_MANAGEMENT_CLIENT_SECRET=
AUTH0_MANAGEMENT_CONNECTION=Username-Password-Authentication
AUTH0_INVITATION_CLIENT_ID=
```

- 전용 Machine-to-Machine 앱을 Auth0 Management API에 승인한다.
- scopes: `read:users`, `create:users`, `update:users`, `read:roles`, `create:user_tickets`.
- 초대 Client ID는 기존 웹 로그인 앱의 ID다. 초대 연결은 해당 앱에서 활성화된
  데이터베이스 연결의 정확한 이름이다. Google 소셜 계정 생성 용도가 아니다.
- 지원 역할: `Admin`, `PropertyManager`, `Finance`, `Inspector`. 역할 정의 자체를 만들거나
  권한을 확장하지 않으며 기존 역할 ID를 조회해 사용한다.
- BFF는 `APP_BASE_URL` 기준 Origin을 검증해 Cloudflare의 외부 HTTPS 주소를 허용한다.

## 지원 기능

- 사용자 20명 단위 조회 및 정확한 이메일 검색. 일반 목록은 Auth0 조회 한도에 맞춰
  50페이지까지이며 그 이후에는 이메일로 검색한다.
- 테넌트 계정 상태·이메일 확인 여부·할당 역할 표시.
- 운영 역할 하나로 변경, 계정 차단·해제.
- 임의의 강한 비밀번호로 데이터베이스 계정을 생성하고 운영 역할을 부여한 뒤
  24시간 일회용 비밀번호 설정 링크 발급. 이메일은 자동 발송하지 않는다.
  링크는 화면에서만 제공하며 저장·로그 기록하지 않는다. 수신자에게 안전하게 전달한다.

## 안전 경계 및 복구

- 본인 및 기존 Admin 계정의 차단·역할 변경, Admin 승격은 금지한다. Auth0 콘솔에서 처리한다.
- 다른 앱 역할이 섞인 사용자의 역할을 임의로 제거하지 않는다.
- 역할 교체는 잠시 계정을 차단한 상태에서 실행한다. 중간 실패 시 자동 해제하지 않는다.
  새 조회로 상태를 확인하고 Auth0 콘솔에서 역할을 바로잡은 뒤 차단 해제한다.
- 초대 부분 실패 시 계정이 이미 만들어졌을 수 있다. 재생성 대신 이메일 조회 후 복구한다.
- 차단과 역할 변경은 이미 발급된 일반 업무용 Access Token을 즉시 회수하지 않는다.
  모든 업무 API에서 즉시 권한 회수를 보장하려면 별도의 세션/토큰 철회 정책이 필요하다.
- 동시 변경 방지는 현재 단일 API 프로세스 내 계정별 잠금이다. 다중 인스턴스나
  Auth0 콘솔의 동시 변경을 아우르는 트랜잭션은 아니므로 운영 확장 전 분산 잠금과
  변경 이력 저장 및 복구 흐름 보강이 필요하다.
- Auth0 테넌트를 다른 앱과 공유하면 계정 차단은 다른 앱에도 영향을 줄 수 있다.
- Auth0 429는 재시도 요청으로 안내한다. 쓰기 요청을 자동 재실행하지 않는다.

## 검증 (2026-09-05)

- 실제 M2M 토큰 발급 200, 사용자 조회 200, 역할 조회 200.
- 필요 scopes 5개와 프로젝트 역할 4개 존재 확인. 자격 증명과 사용자 개인정보 출력 없음.
- 실행 중 API `/admin/users` 비로그인 조회 401. 환경 파일 저장 이후 자동 재시작 확인.
- API 205개, 웹 128개 테스트 통과. 양쪽 빌드 및 변경 파일 린트 통과.
- 테스트는 가짜 외부 응답을 사용했다. 실제 사용자 생성·차단·역할 변경은 하지 않았다.
- 인증된 브라우저의 전체 변경 흐름, 데이터베이스 연결 활성화 및 초대 링크 사용은
  아직 실계정으로 검증하지 않았다.

## 참고

- [M2M 앱 생성](https://auth0.com/docs/get-started/auth0-overview/create-applications/machine-to-machine-apps)
- [Management API 토큰 발급](https://auth0.com/docs/secure/tokens/access-tokens/management-api-access-tokens/get-management-api-access-tokens-for-production)
- [사용자 초대 흐름](https://auth0.com/docs/customize/email/send-email-invitations-for-application-signup)
