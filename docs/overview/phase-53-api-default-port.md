# Phase 53: Cloudflare API Default Port

## 변경 이유

Cloudflare API tunnel origin은 `http://localhost:3100`을 가리키지만, API를 `PORT` 없이 실행하면 NestJS bootstrap 기본값 `3000`을 사용했다. 이 포트 계약 불일치로 로컬 API는 정상이어도 `https://api.approid.team/properties`가 `502 Bad Gateway`를 반환했다.

## 변경 내용

- `getApiPort`는 `PORT`가 없을 때 `3100`을 반환한다.
- `PORT`가 명시된 배포 환경은 그 값을 우선한다.
- NestJS bootstrap은 직접 fallback 값을 사용하지 않고 `getApiPort(process.env.PORT)`를 사용한다.

## 업무 영향

property, tenant, contract, payment, maintenance 관련 API의 endpoint와 인증 계약은 변경하지 않았다. Cloudflare tunnel이 올바른 API origin에 연결되도록 실행 포트만 일관되게 맞췄다.

## 검증

- `npm.cmd --prefix api run test -- src/config/api-port.spec.ts`: 2 tests passed.
- `npm.cmd --prefix api run test`: 132 tests passed.
- `npm.cmd --prefix api run build`: passed.
- `npm.cmd --prefix api run lint`: exit 0, 변경 범위 밖 기존 warning 5개가 남아 있다.
