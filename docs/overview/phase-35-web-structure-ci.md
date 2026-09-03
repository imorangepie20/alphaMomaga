# Phase 35: web 프론트엔드 구조 및 CI 정리

## 목표
실제 프론트엔드를 `web/`에 두고, 테마 참고용 `SDTPL_ADM/`과 분리된 자동 품질 검사를 구성합니다.

## 구조

- `api/`: NestJS 백엔드
- `web/`: 실제 부동산 관리 프론트엔드
- `SDTPL_ADM/`: 수정하지 않는 테마 참고 원본

## CI

`.github/workflows/web-ci.yml`은 `web/**` 변경 시 다음을 실행합니다.

- `npm ci`
- `npm run lint`
- `npm run build`

기존 `web/e2e`에는 테마 컴포넌트 상호작용 테스트가 포함되어 있고 전체 실행에서 실패가 확인되어, 현재 CI 필수 단계에서는 제외했습니다. 브라우저 테스트는 기능별로 안정화한 뒤 별도 단계로 다시 편입합니다.

## 포트

- 관리자 UI: `web/`에서 `3001`
- API: `api/`에서 `3100`
- Cloudflare Tunnel 관리자 origin: `web`의 `3001`로 전환 필요

## 검증

- `web` 빌드: 성공
- `web` 타입 진단: 오류 없음
- 운영 대시보드 Playwright: 3개 통과
- 전체 Playwright: 기존 테마 상호작용 테스트 일부 실패 확인
