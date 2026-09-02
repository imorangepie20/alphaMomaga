# 4단계: 임차인 업무 흐름

## 목표

임차인 수납 현황을 매물과 동일한 서버 주도 조회 계약에 연결합니다.

## 구현 내용

- NestJS API에 `GET /tenants`를 추가했습니다.
- 자산 연결, 세대, 임대료, 수납 상태를 포함하는 명시적 임차인 계약을 추가했습니다.
- 임차인 응답 형식을 검증하는 집중 서비스 테스트를 추가했습니다.
- 임차인 화면을 예측 가능한 fallback이 있는 API adapter에 연결했습니다.
- 반환된 데이터에서 전체, 납부 완료, 연체 임차인 지표를 계산합니다.

## 현재 범위

임차인 endpoint는 메모리 기반 조회 모델로 유지됩니다. 영속화, 임차인 변경 작업, 필터링, 인증, 역할 제어는 후속 작업입니다.

## 검증

The focused tenant service test passes, and the browser should show four tenants with two paid, one overdue, and one pending record when the API is available.

다음 단계: 계약 조회를 추가하고 임차인과 계약 사이의 lifecycle 규칙을 검증합니다.