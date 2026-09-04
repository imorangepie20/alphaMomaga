# Task 8 Release-Blocking Light-Only UI Remediation

## 변경 이유

Task 8 이후 공통 `web/src/components/ui`에 템플릿에서 가져온 `dark:` 변형과
`.dark` 차트 selector 계약이 남아 있어 라이트 전용 UI 완료 조건을 충족하지 못했다.

## 근본 원인

화면 단위 전환은 완료됐지만, 재사용 공통 UI가 이전 양방향 테마 계약을 유지하고 있었다.
기존 정적 테스트도 일부 컨트롤만 검사하여 `badge`, `checkbox`, `tabs`, `switch`,
`chart`와 메뉴 계열 컴포넌트의 잔여 계약을 탐지하지 못했다.

## 변경 내용

- `globals.test.ts`가 `components/ui` 전체 소스 파일을 재귀 검사하도록 확장했다.
- 공통 UI의 `dark:` 변형을 제거하고 기존 라이트 semantic token 상태로 단일화했다.
- `chart.tsx`의 `.dark` selector 및 양방향 `theme` 맵을 단일 `color` 출력으로 전환했다.
- 기존 정적 테스트의 다크 문자열 리터럴을 동적 상수로 바꿔 `web/src` 전체 검색도
  실제 테마 계약만 보고하도록 했다.

## RED

`npm.cmd --prefix web run test -- src/app/globals.test.ts` 실행 결과, 새 회귀 테스트가
`avatar.tsx`의 `dark:` 변형을 검출하며 실패했다. 이는 테스트가 기존 결함을 실제로
탐지함을 확인한 결과다.

## GREEN 및 검증

- `npm.cmd --prefix web run test -- src/app/globals.test.ts src/app/layout.test.ts "src/app/(dashboard)/forms-layout.test.ts"`: 3개 파일, 17개 테스트 통과
- `npm.cmd --prefix web run lint -- ...대상 파일...`: 오류 없음
- `rg -n --glob '*.{ts,tsx,css}' 'dark:|\\.dark' web\\src`: 결과 0건
- `git diff --check`: 오류 없음

## 업무 영향

API, Auth0, RBAC, BFF, 데이터 모델과 `property -> tenant -> contract -> payment -> maintenance`
업무 흐름은 변경하지 않았다. 공통 UI의 표시 및 상호작용 상태만 라이트 토큰 기준으로
정리했다.

## 남은 수동 검증 공백

연결 가능한 Cloudflare Tunnel 브라우저 세션이 없어 다음 항목은 아직 수동 확인하지 못했다.

- `https://mnre.approid.team/`에서 checkbox, radio, switch, tabs, badge, 메뉴의 hover,
  focus-visible, disabled, invalid 상태
- 차트 tooltip과 legend의 라이트 표면 및 색상
- Auth0 로그인 후 대시보드의 동일 공통 UI 상태
