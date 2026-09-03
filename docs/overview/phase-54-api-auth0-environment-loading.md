# Phase 54: API Auth0 환경 파일 로딩

## 변경 이유

웹 애플리케이션은 `web/.env.local`에서 Auth0 세션 설정을 읽지만, API는 `process.env`만 읽고 `api/.env`를 로드하지 않았습니다. 따라서 API 프로세스를 별도 환경 변수 없이 실행하면 보호된 변경 요청의 Bearer token 검증이 `JWT authentication is not configured`으로 거부될 수 있었습니다.

## 근본 원인

`AuthConfigService`는 `AUTH_JWKS_URL`, `AUTH_ISSUER`, `AUTH_AUDIENCE`를 필요로 하지만, API 시작 지점인 `api/src/main.ts`에는 `.env` 파일을 `process.env`로 반영하는 호출이 없었습니다.

## 변경 내용

- `api/src/config/load-environment.ts`에서 Node 표준 `process.loadEnvFile`로 `api/.env`를 읽습니다.
- `api/src/main.ts`가 Nest 애플리케이션 생성 전에 환경 파일을 읽습니다.
- 이미 운영 환경에서 주입된 환경 변수는 `.env` 값으로 덮어쓰지 않습니다.
- 로컬 `api/.env`에는 Auth0 JWKS URL, issuer, audience, demo 역할 비활성화 값만 설정합니다. 이 파일은 `.gitignore`로 추적되지 않습니다.

## 검증

- `npm.cmd --prefix api run test -- src/config/load-environment.spec.ts`
  - `api/.env` 형식의 fixture 로드 및 프로세스 환경 변수 우선순위를 검증합니다.

## 운영 주의사항

- API 프로세스는 환경 파일을 시작 시 한 번 읽으므로 `api/.env` 변경 후 재시작해야 합니다.
- 배포 환경에서는 비밀 관리 도구나 런타임 환경 변수로 같은 키를 주입할 수 있으며, 해당 값이 로컬 파일보다 우선합니다.
