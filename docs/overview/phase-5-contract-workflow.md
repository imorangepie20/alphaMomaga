# 5단계: 계약 업무 흐름

## 목표

부동산 매니저가 임대 조건과 계약 lifecycle의 유효성을 명확히 확인할 수 있게 합니다.

## 구현 내용

- NestJS API에 `GET /contracts`를 추가했습니다.
- 안정적인 ID를 통해 자산과 임차인 관계를 추가했습니다.
- ISO 날짜와 lifecycle 상태 검증을 추가했습니다.
- 예정, 유효, 만료, 종료 계약과 잘못된 날짜를 검증하는 서비스 테스트를 추가했습니다.
- 계약 화면을 API 데이터와 임차인 이름에 연결했습니다.
- 반환된 계약 데이터에서 유효 계약과 갱신 검토 지표를 계산합니다.

## 현재 범위

계약 endpoint는 메모리 기반 조회 모델로 유지됩니다. 생성/수정 작업, 영속화, 인증, 인가는 후속 작업입니다.

## 검증

The contract lifecycle unit tests and contracts API e2e test pass. The browser screen displays the returned lease records and derived status labels.

다음 단계: 수납 업무 흐름부터 영속화와 변경 작업의 경계를 도입합니다.