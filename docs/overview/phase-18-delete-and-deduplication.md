# Phase 18: 중복 검증 및 DELETE 작업

## 목표
프로퍼티와 임차인에 DELETE 작업을 추가하고, 임차인 중복 검증을 구현합니다.

## 완료된 작업

### 1. Properties DELETE 작업
- **파일**: `api/src/properties/`
- **새로운 서비스 메서드**:
  - `delete(id: string, principal?: AuthenticatedPrincipal): Promise<void>`
- **새로운 컨트롤러 엔드포인트**:
  - `DELETE /properties/:id` - 부동산 삭제 (권한: `property:manage`)
- **감사 이벤트**: `property.deleted`

### 2. Tenants 중복 검증 및 DELETE 작업
- **파일**: `api/src/tenants/`
- **중복 검증**: 같은 `propertyId`와 `unit`의 조합으로 이미 있는 임차인 확인
  - 데이터베이스: `and(eq(tenants.propertyId, input.propertyId), eq(tenants.unit, input.unit))` 쿼리
  - 인-메모리: 배열 필터 검색
- **새로운 서비스 메서드**:
  - `delete(id: string, principal?: AuthenticatedPrincipal): Promise<void>`
- **새로운 컨트롤러 엔드포인트**:
  - `DELETE /tenants/:id` - 임차인 삭제 (권한: `tenant:manage`)
- **감사 이벤트**: `tenant.deleted`
- **에러 메시지**: 중복 시 "같은 부동산의 {unit}에 이미 임차인이 있습니다"

### 3. 권한 매트릭스 업데이트
- **새 권한**: `property:manage`
- **권한 보유 역할**:
  - **Admin**: `property:manage` 추가
  - **PropertyManager**: `property:manage` 추가
  - **Finance, Inspector**: 변경 없음

## 구현 세부사항

### 중복 검증 패턴
- 모든 쓰기 작업 전에 중복 검사
- 트랜잭션 내에서 원자적 실행
- 명확한 한국어 에러 메시지 반환

### 삭제 작업 패턴
- 트랜잭션 기반 삭제
- 같은 트랜잭션 내에서 감사 로그 기록
- 인-메모리 폴백: 배열에서 제거

### 데이터베이스 검증
- `DELETE` 작업도 감사 로깅됨
- 외래키 제약: PostgreSQL이 자동으로 처리 (cascade 또는 제약)

## 테스트 상태
- ✅ 모든 12개 테스트 파일 통과
- ✅ 총 40개 테스트 통과
- ✅ TypeScript 빌드 성공

## API 엔드포인트 요약 (현재)

### 읽기
- `GET /properties` - 전체 부동산 조회
- `GET /tenants` - 전체 임차인 조회
- `GET /contracts` - 전체 계약 조회
- `GET /payments` - 전체 수납 조회
- `GET /maintenance` - 전체 유지보수 조회
- `GET /inspections` - 전체 점검 조회
- `GET /admin/roles` - 역할 정의 조회

### 생성
- `POST /properties` ⚠️ *아직 구현 안 됨*
- `POST /tenants` ✅ (권한: `tenant:manage`)
- `POST /contracts` ✅ (권한: `contract:manage`)
- `POST /payments` ✅ (권한: `payment:manage`)
- `POST /maintenance` ✅ (권한: `maintenance:manage`)
- `POST /inspections` ✅ (권한: `inspection:manage`)

### 업데이트
- `PUT /contracts/:id` ✅ (권한: `contract:manage`)
- `PUT /payments/:id` ✅ (권한: `payment:manage`)
- `PUT /maintenance/:id` ✅ (권한: `maintenance:manage`)
- `PUT /inspections/:id` ✅ (권한: `inspection:manage`)

### 삭제
- `DELETE /properties/:id` ✅ (권한: `property:manage`)
- `DELETE /tenants/:id` ✅ (권한: `tenant:manage`)

## 다음 단계
1. Properties 생성 엔드포인트 추가
2. 외래키 검증: Contract는 유효한 propertyId/tenantId 참조 확인
3. Payment는 유효한 contractId 참조 확인
4. Maintenance/Inspection은 유효한 propertyId 참조 확인
5. 연쇄 삭제(cascade) 규칙 정의

## 기술적 고려사항
- 모든 DELETE 작업은 감사 로깅됨
- 중복 검증은 데이터베이스 쿼리 또는 인-메모리 배열 모두에서 지원
- 트랜잭션 내 원자성 보장: 삭제 및 감사 로그 모두 성공하거나 모두 실패
