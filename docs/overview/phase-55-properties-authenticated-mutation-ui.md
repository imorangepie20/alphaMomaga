# Phase 55: Properties 인증 생성·수정 UI

## 변경 이유

`/properties` 화면은 조회 전용이어서 Auth0 로그인과 API 권한 설정이 완료되어도 브라우저에서 보호된 `POST` 또는 `PUT` 요청을 실행할 수 없었습니다. 기존 `Phase 34` 기록은 템플릿 UI를 실제 애플리케이션 범위에서 제거한 상태를 설명하고 있었습니다.

## 변경 내용

- `속성 추가` Dialog에서 이름, 위치, 유형, 점유율, 상태를 입력해 새 자산을 생성합니다.
- 각 자산 행의 `수정` 버튼은 같은 Dialog에 현재 값을 채워 수정합니다.
- 브라우저는 `/api/proxy/properties`와 `/api/proxy/properties/:id`만 호출합니다.
- BFF는 서버 Auth0 session에서 access token을 가져와 API에 전달하므로 브라우저 코드에는 token이 노출되지 않습니다.
- `401`은 재로그인 안내, `403`은 속성 관리 권한 부족 안내로 구분해 표시합니다.

## 검증

- `npm.cmd --prefix web run test -- src/lib/property-mutation.test.ts`
  - 생성 `POST`, 수정 `PUT`, `401` 오류 전달을 검증합니다.
- `web\\node_modules\\.bin\\tsc.cmd --noEmit --project web\\tsconfig.json`
  - TypeScript 검사 통과.
- `npm.cmd --prefix web run test:e2e -- e2e/auth-session.spec.ts`
  - 미인증 dashboard redirect 통과.

## 실제 브라우저 검증

1. Auth0에서 사용자에게 정확히 하나의 `Admin` 역할을 할당합니다.
2. Post Login Action이 `https://alpha-momega.app/role` access-token claim을 설정하도록 배포합니다.
3. 로그아웃 후 `https://mnre.approid.team/properties`에서 다시 로그인합니다.
4. `속성 추가` 또는 `수정`을 저장하고 Network에서 BFF 요청이 `200` 또는 `201`인지 확인합니다.

## 알려진 검증 제약

`npm.cmd --prefix web run test`는 `e2e/*.spec.ts`까지 Vitest로 수집하여 Playwright의 `test.describe()` 오류가 발생합니다. Playwright 파일은 `npm.cmd --prefix web run test:e2e`로 별도 실행해야 합니다.
