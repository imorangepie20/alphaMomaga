# Phase 60: 핵심 운영 관리 폼 통합

## 변경 이유

속성, 임차인, 계약 관리 다이얼로그가 화면마다 직접 `Label`, `Input`, native
`select`를 조합하고 있어 라벨과 입력 컨트롤 간격, 오류 표시, native select
표면이 일관되지 않았습니다. 라이트 전용 UI 시스템의 공통 폼 계약을 실제 운영
흐름에 적용해야 했습니다.

## 근본 원인

공통 컨트롤은 준비되어 있었지만 운영 화면이 이를 사용하지 않아 각 화면의
Tailwind 클래스가 폼 레이아웃을 다시 정의하고 있었습니다. 이 구조는 테마와
컨트롤 규격 변경이 개별 화면에 누락되는 원인이었습니다.

## 변경 내용

- `PropertyManager`, `TenantManager`, `ContractManager`의 모든 입력 필드를
  `FormField`로 전환했습니다.
- 기존 native `select`를 `NativeSelect`, `NativeSelectOption`으로 전환했습니다.
- 공통 `FieldError`로 저장 실패 메시지를 표시하도록 통일했습니다.
- 계약 생성 시 임차인 선택으로 속성, 호실, 월 임대료를 자동 연결하는 기존 동작,
  계약 갱신 lifecycle, mutation과 Auth0 BFF 호출은 변경하지 않았습니다.
- `payments`, `maintenance`를 포함한 핵심 운영 조회 화면의 남은 `dark:` 상태
  색상 변형을 제거해 라이트 전용 계약에 맞췄습니다.

## 업무 흐름 영향

`property -> tenant -> contract -> payment -> maintenance -> inspection` 순서의
도메인 관계와 API 요청 형식은 변경하지 않았습니다. 이번 변경은 관리자 화면의
표현 계층에만 적용되며, 서버의 RBAC 및 lifecycle 검증을 그대로 사용합니다.

## 최종 라이트 전용 UI 검증

공통 UI를 포함한 전체 소스 검토에서 화면 단위 전환만으로는 충분하지 않음을 확인했습니다.
`components/ui`에 남아 있던 `dark:` 변형과 `chart.tsx`의 `.dark` selector도 제거하고,
차트 색상은 각 항목의 단일 `color` 값으로 출력하도록 통일했습니다. 이로써 브라우저,
HMR 상태, 시스템 테마에 따라 이전 다크 스타일 계약이 다시 적용되는 경로를 제거했습니다.

### 자동 검증

- 정적 검색: `rg -n --glob '*.{ts,tsx,css}' 'dark:|\\.dark' web/src` 결과 없음.
- 비활성 테마 의존성 검색: `ThemeProvider`, `ThemeToggle`, `next-themes`, `dark:`의 실제 UI 의존성은 없습니다. 테스트 파일의 부정 단언 문자열만 검색됩니다.
- 회귀 테스트: `npm.cmd --prefix web run test -- src/app/layout.test.ts src/app/globals.test.ts src/components/ui/field.test.tsx src/app/(dashboard)/forms-layout.test.ts src/lib/property-mutation.test.ts src/lib/tenant-mutation.test.ts src/lib/contract-mutation.test.ts src/lib/protected-api.test.ts` 결과 8개 파일, 33개 테스트 통과.
- lint: `npm.cmd --prefix web run lint`는 오류 없이 종료했습니다. 기존 코드의 unused import와 React Compiler 호환성 관련 경고 58건은 남아 있으며, 이번 라이트 UI 변경으로 추가된 오류는 없습니다.
- production build: `npm.cmd --prefix web run build`가 TypeScript 검사와 106개 페이지 생성까지 통과했습니다.

### 업무 흐름 영향

이번 정리는 표시 토큰과 공통 UI 상태만 대상으로 합니다. Auth0, API endpoint, RBAC, BFF,
데이터 모델과 `property -> tenant -> contract -> payment -> maintenance -> inspection`의 mutation 및 lifecycle 계약은 회귀 테스트로 유지 확인했으며 변경하지 않았습니다.

### 남은 수동 검증

Cloudflare Tunnel 브라우저 세션이 이 작업 환경에 연결되지 않아 실제 페이지 조작은 아직 수행하지 못했습니다. 다음은 완료로 표시하지 않고 수동 확인 항목으로 남깁니다.

- `https://mnre.approid.team/`에서 checkbox, radio, switch, tabs, badge와 메뉴의 hover, focus-visible, disabled, invalid 상태
- `/properties`, `/tenants`, `/contracts`의 native select, 날짜 입력, 등록 및 수정 저장
- `/payments`, `/maintenance`, `/inspections`, `/settings`, `/admin/users`의 라이트 표면과 글자 대비
- Auth0 로그인/로그아웃 후 대시보드 및 차트 tooltip, legend의 표시 상태

## 검증 결과

- RED: `forms-layout.test.ts`가 세 manager 화면의 `FormField` 부재로 실패했습니다.
- GREEN: `npm.cmd --prefix web run test -- src/lib/property-mutation.test.ts src/lib/tenant-mutation.test.ts src/lib/contract-mutation.test.ts src/app/(dashboard)/forms-layout.test.ts` 실행 결과 4개 파일, 10개 테스트가 통과했습니다.
- 정적 검사: 대상 6개 운영 화면에 `select`, `Label`, `dark:` 잔여 사용이 없음을 확인했습니다.
- lint: 대상 6개 운영 화면 ESLint가 통과했습니다.
- 수동 확인: 이 작업 세션에는 제어 가능한 브라우저가 연결되지 않아 Cloudflare Tunnel의 등록·수정 수동 검증은 실행하지 못했습니다. `https://mnre.approid.team/properties`, `/tenants`, `/contracts`에서 native select와 저장 동작을 후속 확인해야 합니다.
