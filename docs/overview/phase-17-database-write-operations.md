# Phase 17: 데이터베이스 쓰기 작업 구현

## 목표
계약, 수납, 유지보수, 점검 엔티티에 대한 데이터베이스 기반 생성 및 업데이트 작업을 구현합니다.

## 완료된 작업

### 1. 계약(Contract) 쓰기 작업
- **파일**: `api/src/contracts/`
- **추가된 입력 타입**: `CreateContractInput`, `UpdateContractInput`
- **새로운 서비스 메서드**:
  - `create(input: CreateContractInput, principal?: AuthenticatedPrincipal): Promise<Contract>`
  - `update(id: string, input: UpdateContractInput, principal?: AuthenticatedPrincipal): Promise<Contract>`
- **새로운 컨트롤러 엔드포인트**:
  - `POST /contracts` - 계약 생성 (권한: `contract:manage`)
  - `PUT /contracts/:id` - 계약 업데이트 (권한: `contract:manage`)
- **감사 이벤트**: `contract.created`, `contract.updated`

### 2. 수납(Payment) 쓰기 작업
- **파일**: `api/src/payments/`
- **추가된 입력 타입**: `CreatePaymentInput`, `UpdatePaymentInput`
- **새로운 서비스 메서드**:
  - `create(input: CreatePaymentInput, principal?: AuthenticatedPrincipal): Promise<Payment>`
  - `update(id: string, input: UpdatePaymentInput, principal?: AuthenticatedPrincipal): Promise<Payment>`
- **새로운 컨트롤러 엔드포인트**:
  - `POST /payments` - 수납 생성 (권한: `payment:manage`)
  - `PUT /payments/:id` - 수납 업데이트 (권한: `payment:manage`)
- **감사 이벤트**: `payment.created`, `payment.updated`

### 3. 유지보수(Maintenance) 쓰기 작업
- **파일**: `api/src/maintenance/`
- **추가된 입력 타입**: `CreateMaintenanceInput`, `UpdateMaintenanceInput`
- **새로운 서비스 메서드**:
  - `create(input: CreateMaintenanceInput, principal?: AuthenticatedPrincipal): Promise<Maintenance>`
  - `update(id: string, input: UpdateMaintenanceInput, principal?: AuthenticatedPrincipal): Promise<Maintenance>`
- **새로운 컨트롤러 엔드포인트**:
  - `POST /maintenance` - 유지보수 생성 (권한: `maintenance:manage`)
  - `PUT /maintenance/:id` - 유지보수 업데이트 (권한: `maintenance:manage`)
- **감사 이벤트**: `maintenance.created`, `maintenance.updated`

### 4. 점검(Inspection) 쓰기 작업
- **파일**: `api/src/inspections/`
- **추가된 입력 타입**: `CreateInspectionInput`, `UpdateInspectionInput`
- **새로운 서비스 메서드**:
  - `create(input: CreateInspectionInput, principal?: AuthenticatedPrincipal): Promise<Inspection>`
  - `update(id: string, input: UpdateInspectionInput, principal?: AuthenticatedPrincipal): Promise<Inspection>`
- **새로운 컨트롤러 엔드포인트**:
  - `POST /inspections` - 점검 생성 (권한: `inspection:manage`)
  - `PUT /inspections/:id` - 점검 업데이트 (권한: `inspection:manage`)
- **감사 이벤트**: `inspection.created`, `inspection.updated`

## 구현 세부사항

### 공통 패턴
1. **입력 검증**: 필수 필드 확인 및 비즈니스 규칙 검증
2. **데이터베이스 트랜잭션**: 모든 쓰기 작업은 트랜잭션 내에서 실행
3. **감사 로깅**: 모든 쓰기 작업은 같은 트랜잭션 내에서 감사 로그 기록
4. **권한 검증**: `AuthGuard`와 `PermissionsGuard`를 사용한 엔드포인트 보호
5. **인-메모리 폴백**: 데이터베이스 미연결 시 인-메모리 배열 사용

### 권한 매트릭스
기존 역할 정의에 이미 다음 권한이 포함됨:
- **Admin**: 모든 권한 보유
- **PropertyManager**: `contract:manage`, `payment:manage`, `maintenance:manage`, `inspection:manage` 보유
- **Finance**: `payment:manage` 보유
- **Inspector**: `inspection:manage` 보유

## 테스트 상태
- ✅ 모든 12개 테스트 파일 통과
- ✅ 총 40개 테스트 통과
- ✅ TypeScript 빌드 성공

## 다음 단계
1. PostgreSQL CI에서 새로운 엔드포인트 e2e 테스트
2. 프론트엔드에서 새로운 POST/PUT 엔드포인트 통합
3. 추가 감사 이벤트 필요시 구현
4. 프로덕션 ID 제공자 설정

## 기술적 고려사항
- 모든 통화 값은 데이터베이스에서 원(won)으로 저장되고 API에서 포맷된 문자열로 반환됨
- 모든 날짜는 ISO 8601 형식(`YYYY-MM-DD`)으로 저장 및 전송
- 트랜잭션 내 모든 작업은 원자적으로 실행됨 (all-or-nothing)
- 인-메모리 폴백은 개발 및 테스트 용도로만 사용됨
