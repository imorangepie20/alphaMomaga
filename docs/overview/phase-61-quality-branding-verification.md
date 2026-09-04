# Phase 61: 품질 경고 정리 및 브랜드 검증

## 변경 이유

라이트 전용 UI 전환 이후 전체 `npm.cmd --prefix web run lint`는 오류 없이 종료되었지만, 미사용 import와 React Compiler 관련 경고 58건이 남아 있었습니다. 또한 사용자가 제공한 Alpha Momega 로고가 아직 실제 제품 UI에 연결되지 않았고, Cloudflare Tunnel의 인증 경계에 맞지 않는 대시보드 e2e 시나리오가 있었습니다.

## 근본 원인과 변경 내용

- 실제 사용처가 없는 import, helper, props를 제거했습니다.
- `useIsMobile`과 공통 `Carousel`은 effect 내부에서 초기 상태를 동기적으로 변경하던 구조였습니다. 브라우저 외부 상태를 구독하는 `useSyncExternalStore`와 carousel 이벤트 구독으로 전환해 SSR 초기값과 이벤트 갱신을 분리했습니다.
- carousel 예제는 API가 전달되는 시점에 초기 snapshot을 설정하고, effect는 select 이벤트 구독과 해제만 수행하도록 정리했습니다.
- `useReactTable()`은 imperative 함수를 반환하므로 React Compiler가 해당 호출만 안전하게 건너뜁니다. 이 알려진 제약은 전역 규칙 완화 대신 해당 호출마다 설명과 함께 국소적으로 명시했습니다.
- 제공된 PNG 로고를 인증 카드와 대시보드 사이드바에 적용하고 정적 회귀 테스트를 추가했습니다.
- 보호된 대시보드 e2e는 `PLAYWRIGHT_AUTH_STORAGE_STATE`가 있을 때만 콘텐츠를 검증하도록 수정했습니다. 인증 정보가 없는 경우에는 로그인 리디렉션을 별도 `auth-session.spec.ts`에서 검증합니다.
- `auth0-storage-state.json`을 `web/.gitignore`에 추가해 인증 쿠키가 저장소에 포함되지 않도록 했습니다.

## 업무 흐름 영향

이 변경은 UI 렌더링, 개발 도구 경고, e2e 인증 전제만 다룹니다. `property -> tenant -> contract -> payment -> maintenance -> inspection` 흐름, Auth0 BFF, RBAC, API endpoint, mutation 및 lifecycle 계약은 변경하지 않았습니다.

## 검증 결과

- `npm.cmd --prefix web run test -- src/components/layout/branding.test.ts src/app/layout.test.ts src/app/globals.test.ts src/components/ui/field.test.tsx src/app/(dashboard)/forms-layout.test.ts src/lib/property-mutation.test.ts src/lib/tenant-mutation.test.ts src/lib/contract-mutation.test.ts src/lib/protected-api.test.ts`: 9개 파일, 34개 테스트 통과
- `npm.cmd --prefix web run lint`: 오류와 경고 없이 통과
- `npm.cmd --prefix web run build`: TypeScript 검사 및 106개 라우트 생성 통과
- `https://mnre.approid.team/`: HTTP `200`
- `https://api.approid.team/properties`: HTTP `200`
- `PLAYWRIGHT_BASE_URL=https://mnre.approid.team npm.cmd --prefix web run test:e2e -- e2e/auth-session.spec.ts e2e/dashboards-ops.spec.ts`: unauthenticated 로그인 리디렉션 1건 통과, 인증 storage state가 필요한 대시보드 3건 skip

## 남은 수동 확인

관리자 Auth0 계정으로 로그인한 뒤 `PLAYWRIGHT_AUTH_STORAGE_STATE`를 제공해 대시보드 콘텐츠 e2e 3건을 실행하거나, Cloudflare Tunnel 브라우저에서 등록·수정 흐름을 직접 확인해야 합니다. 이 단계는 실제 인증 쿠키가 필요한 외부 상태이므로 현재 자동화 환경에서는 수행하지 않았습니다.
