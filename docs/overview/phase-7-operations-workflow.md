# 7단계: 운영 업무 흐름

## 목표

검증된 서버 주도 기록을 통해 유지보수 작업 요청과 자산 점검을 확인할 수 있게 합니다.

## 구현 내용

- NestJS API에 `GET /maintenance`와 `GET /inspections`를 추가했습니다.
- 작업 요청과 점검 완료일에 대한 ISO 날짜 및 lifecycle 검증을 추가했습니다.
- 긴급 운영 검토를 지원하기 위해 점검 우선순위를 추가했습니다.
- 집중 서비스 테스트와 API end-to-end 테스트를 추가했습니다.
- 두 한국어 관리자 화면을 fallback 데이터가 있는 API adapter에 연결했습니다.
- 반환된 데이터에서 작업량, 완료, 검토, 긴급 KPI를 계산합니다.

## 현재 범위

두 endpoint는 메모리 기반 조회 모델로 유지됩니다. 작업 요청 변경, 담당자, 협력업체, 첨부파일, 영속화, 인증, 인가는 후속 작업입니다.

## 검증

All API unit tests, operations API e2e tests, API build, frontend lint, and browser route checks pass.

다음 단계: 운영 변경 작업에 영속화와 역할 기반 접근 제어를 추가합니다.