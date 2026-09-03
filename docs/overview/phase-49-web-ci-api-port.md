# Phase 49: Web CI API 포트 정렬

## 문제

Web CI는 API 준비 확인과 Playwright API 연동 테스트에서
`http://localhost:3100`을 요청합니다. 하지만 API 기동 단계에서 `PORT`를
전달하지 않아 NestJS 기본 포트인 `3000`으로 실행되었습니다.

## 원인

- `api/src/main.ts`는 `process.env.PORT ?? 3000`을 사용합니다.
- `.github/workflows/web-ci.yml`의 API 기동 명령은 `PORT`를 설정하지 않았습니다.
- 같은 워크플로의 health check와 브라우저 테스트 기본 API 주소는 `3100`입니다.

## 변경

API 기동 명령에 `PORT=3100`을 설정했습니다. 이로써 CI의 API 프로세스,
health check, Playwright `API_URL` 기본값, 로컬·Cloudflare 문서의 API 포트가
동일한 `3100` 계약을 사용합니다.

## 검증

- 워크플로 API 기동 명령에 `PORT=3100`이 포함되는지 정적 검증
- API를 `3100` 포트로 실행한 뒤 `GET /properties` 응답 확인
