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

## 검증 결과

- RED: `forms-layout.test.ts`가 세 manager 화면의 `FormField` 부재로 실패했습니다.
- GREEN: `npm.cmd --prefix web run test -- src/lib/property-mutation.test.ts src/lib/tenant-mutation.test.ts src/lib/contract-mutation.test.ts src/app/(dashboard)/forms-layout.test.ts` 실행 결과 4개 파일, 10개 테스트가 통과했습니다.
- 정적 검사: 대상 6개 운영 화면에 `select`, `Label`, `dark:` 잔여 사용이 없음을 확인했습니다.
- lint: 대상 6개 운영 화면 ESLint가 통과했습니다.
- 수동 확인: 이 작업 세션에는 제어 가능한 브라우저가 연결되지 않아 Cloudflare Tunnel의 등록·수정 수동 검증은 실행하지 못했습니다. `https://mnre.approid.team/properties`, `/tenants`, `/contracts`에서 native select와 저장 동작을 후속 확인해야 합니다.
