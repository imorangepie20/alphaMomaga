# 비즈니스 도메인 맵

## 핵심 엔터티

- Property
  - 부동산 매니저가 관리하는 자산 또는 세대
  - 주소, 유형, 상태, 공급 정보 등의 메타데이터 보유
- Tenant
  - 자산을 점유하거나 임차하는 사람 또는 조직
  - 계약, 수납 이력, 커뮤니케이션 이력과 연결
- Contract
  - 임대차 조건과 계약 lifecycle을 정의
  - 자산과 임차인을 연결
- Payment
  - 임대료 수납, 연체 상태, 수납 이력을 추적
- Maintenance
  - 자산에 연결된 수리, 점검, 서비스 작업을 추적
- User
  - 관리자, 매니저 또는 조회자 역할
  - 접근 권한과 업무 작업을 제어

## 관계 맵

Property -> Tenant
Property -> Contract
Property -> Payment
Property -> Maintenance
Tenant -> Contract
Tenant -> Payment
Contract -> Payment

## 업무 흐름

1. 자산 생성
2. 임차인 배정 또는 공실 준비
3. 계약 생성 또는 갱신
4. 임대료 수납 추적
5. 유지보수와 점검 기록
6. 점유율, 연체 위험, 포트폴리오 상태 모니터링
7. 관리자가 통합 대시보드 검토

## 설계 원칙

새 기능을 추가하거나 버그를 수정할 때 업무 흐름의 무결성이 깨지지 않도록 관계를 명시적으로 유지합니다.
