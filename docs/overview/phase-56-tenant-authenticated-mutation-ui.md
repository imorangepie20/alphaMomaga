# Phase 56: Tenant 인증 생성·수정 UI

- Tenant 생성과 수정 Dialog를 추가했습니다.
- 생성은 속성, 호실, 월 임대료, 납부 상태를 입력하고, 수정은 API 계약대로 연결 속성을 변경하지 않습니다.
- 요청은 Auth0 BFF `POST` 및 `PUT /api/proxy/tenants`를 사용합니다.
- `web/src/lib/roles.ts` fallback에 API와 동일한 `property:manage` 권한을 추가했습니다.
- `npm.cmd --prefix web run test -- src/lib/tenant-mutation.test.ts`와 TypeScript 검사를 실행했습니다.
