# 운영 lifecycle 시뮬레이션 설계

## 목표

가상 자산과 임차인을 시작점으로 `property -> tenant -> contract -> payment -> maintenance -> inspection` 전 단계를 API 경계에서 검증하고, 발견된 공백을 테스트와 구현으로 보완한다.

## 범위와 격리

- 로컬 단계는 `AUTH_ALLOW_DEMO_ROLE=true` 및 `x-demo-role: PropertyManager`만 사용한다.
- 생성 데이터의 이름과 작업 제목에는 `SIM-20260904-` 접두사를 사용한다.
- 로컬 API의 메모리 저장소는 테스트마다 새 Nest 애플리케이션을 만들고 종료해 격리한다.
- Cloudflare 단계는 Auth0 `Admin` 또는 `PropertyManager` access token을 사용한다. 테스트가 생성한 데이터만 접두사와 ID로 추적해 삭제한다.
- 실제 운영 데이터, 기존 fixture, Auth0 설정, RBAC 정의는 변경하지 않는다.

## 시나리오

1. `POST /properties`로 `SIM-20260904-한강 리버뷰` 자산을 생성하고 `GET /properties`에서 ID와 `Active` 상태를 확인한다.
2. `POST /tenants`로 `SIM-20260904-김하늘` 임차인을 생성하고 같은 `propertyId`, `A-901`, 월 임대료를 확인한다.
3. `POST /contracts`로 두 레코드를 연결한 활성 계약을 생성하고 시작일·종료일·월 임대료를 확인한다.
4. `POST /payments`로 동일 계약의 완납 및 연체 납부를 생성하고 `PUT /payments/:id`로 상태 전이와 지급일을 검증한다.
5. `POST /maintenance`로 유지보수 요청을 생성하고 `Pending -> Scheduled -> Completed` 상태 전이를 검증한다.
6. `POST /inspections`로 정기 점검을 생성하고 `Pending -> Scheduled -> Completed` 및 완료일을 검증한다.
7. 각 생성 API에 대해 존재하지 않는 상위 ID, 잘못된 날짜, 권한 없는 `Finance` 역할, 인증 없는 요청을 검증한다.
8. 단계별 생성 결과를 다시 `GET`으로 조회해 관계 키와 lifecycle 상태가 유지되는지 확인한다.

## 발견 대상 공백

- Payment, Maintenance, Inspection에 `POST` 구현과 UI mutation 연결이 있는지 확인한다.
- 운영 리소스별 DELETE 또는 테스트 cleanup 계약이 충분한지 확인한다.
- Contract와 Payment, Maintenance, Inspection 간 상위 ID 검증이 실제 HTTP 경계에서 일관적인지 확인한다.
- Cloudflare에서 Auth0 access token을 안전하게 주입해 실행하는 방법과 cleanup 절차를 문서화한다.

## 성공 기준

- 로컬 통합 테스트가 가상 lifecycle 전 단계를 생성·수정·조회하고 권한/입력 오류를 검증한다.
- 테스트 종료 후 메모리 데이터가 남지 않는다.
- 발견된 공백은 재현 테스트, 최소 구현, 회귀 테스트 순서로 해결한다.
- Cloudflare에서는 인증 상태가 제공되었을 때 같은 시나리오를 실행하고, 생성 데이터 cleanup 결과를 확인한다.
- 변경 이유, 근본 원인, 구현 내용, 검증 결과를 `docs/overview/`에 한국어로 기록한다.
