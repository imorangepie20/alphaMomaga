# 부동산 관리 도메인

## 개요

이 프로젝트는 부동산 매니저와 관리자를 위한 부동산 관리 애플리케이션을 모델링합니다. 비즈니스 도메인은 마케팅이나 영업 전용 활동보다 실제 운영 흐름을 중심으로 구성합니다.

## 핵심 엔터티

### Property
- 관리 대상 세대, 건물, 사무실 또는 주거 자산을 나타냅니다.
- 주소, 유형, 상태, 세대 수, 담당 매니저 등 식별 및 운영 데이터를 포함합니다.
- 점유율과 자산 단위 운영 보고를 지원합니다.

### Tenant
- 자산을 점유하거나 임차하는 사람 또는 조직을 나타냅니다.
- 연락처, 임대차 메타데이터, 수납 이력을 보유합니다.
- 계약과 수납 활동에 연결됩니다.

### Contract
- 자산과 임차인 사이의 법적 임대차 관계를 정의합니다.
- 시작일, 종료일, 월 임대료, 상태, 갱신 정보를 포함합니다.
- 계약 유효성과 상태 흐름을 검증해야 합니다.

### Payment
- 임대료 수납과 연체 상태를 추적합니다.
- 월 수납 금액, 납부 예정일, 상태, 수납 이력을 기록합니다.
- 연체 또는 수납 예정 항목의 운영 모니터링을 지원합니다.

### Maintenance
- 점검, 수리 요청, 세대 작업 요청을 추적합니다.
- 자산 기록과 운영 작업량에 연결됩니다.
- 유지보수 backlog와 자산 상태 추이를 보여줍니다.

### User / Role
- 매니저, 관리자 또는 조회자를 나타냅니다.
- 민감한 비즈니스 데이터와 운영 작업에 대한 접근을 제어합니다.
- 서버에서 권한 경계를 강제합니다.

## 주요 관계

- Property has many Tenant records
- Property has many Contract records
- Property has many Payment records
- Property has many Maintenance records
- Tenant belongs to one Property
- Contract belongs to one Property and one Tenant
- Payment belongs to one Property and optionally one Contract
- User can manage multiple Properties

## Lifecycle 및 운영 흐름

1. 자산을 생성하거나 가져옵니다.
2. 임차인을 배정하거나 자산을 공실로 표시합니다.
3. 계약을 생성하거나 갱신합니다.
4. 월 임대료와 연체 상태를 추적합니다.
5. 유지보수 요청과 점검을 기록합니다.
6. 점유율, 연체 세대, 갱신 위험을 검토합니다.
7. 관리자가 포트폴리오 요약과 운영 상태를 검토합니다.

## 유지해야 할 비즈니스 규칙

- A tenant must be tied to a valid active or upcoming contract.
- Payment status must distinguish pending, paid, overdue, and cancelled states.
- Maintenance work should be trackable by status and date.
- Contract validity should be checked by lease dates and state.
- Authorization must be enforced for all manager and admin actions.

## 설계 원칙

새 기능이나 버그 수정이 자산 lifecycle의 운영 무결성을 깨뜨리지 않도록 이 도메인 모델을 명확하고 명시적으로 유지합니다.
