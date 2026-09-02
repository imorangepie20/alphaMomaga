# Phase 19: 외래키 검증(Foreign Key Validation)

## 목표
모든 엔티티 생성 시 외래키 관계를 검증하여 데이터 일관성을 보장합니다.

## 완료된 작업

### 1. Contracts 외래키 검증
- **검증 항목**:
  - `propertyId` - Properties 테이블에 존재하는 ID인지 확인
  - `tenantId` - Tenants 테이블에 존재하는 ID인지 확인
- **구현 방식**:
  - 데이터베이스: `SELECT ... FROM properties WHERE id = ?` 및 `SELECT ... FROM tenants WHERE id = ?` 쿼리
  - 인-메모리: fixtures 데이터 배열에서 ID 존재 확인
- **에러 메시지**: "Property {id}을(를) 찾을 수 없습니다" / "Tenant {id}을(를) 찾을 수 없습니다"

### 2. Payments 외래키 검증
- **검증 항목**:
  - `contractId` - Contracts 테이블에 존재하는 ID인지 확인
- **구현 방식**:
  - 데이터베이스: `SELECT ... FROM contracts WHERE id = ?` 쿼리
  - 인-메모리: fixtures 데이터 배열에서 ID 존재 확인
- **에러 메시지**: "Contract {id}을(를) 찾을 수 없습니다"

### 3. Maintenance 외래키 검증
- **검증 항목**:
  - `propertyId` - Properties 테이블에 존재하는 ID인지 확인
- **구현 방식**:
  - 데이터베이스: `SELECT ... FROM properties WHERE id = ?` 쿼리
  - 인-메모리: fixtures 데이터 배열에서 ID 존재 확인
- **에러 메시지**: "Property {id}을(를) 찾을 수 없습니다"

### 4. Inspections 외래키 검증
- **검증 항목**:
  - `propertyId` - Properties 테이블에 존재하는 ID인지 확인
- **구현 방식**:
  - 데이터베이스: `SELECT ... FROM properties WHERE id = ?` 쿼리
  - 인-메모리: fixtures 데이터 배열에서 ID 존재 확인
- **에러 메시지**: "Property {id}을(를) 찾을 수 없습니다"

## 구현 세부사항

### 검증 타이밍
- 모든 외래키 검증은 트랜잭션 내에서 INSERT/UPDATE 전에 실행
- 검증 실패 시 BadRequestException (400) 반환

### 데이터베이스 vs 인-메모리
- **데이터베이스**: Drizzle ORM을 사용하여 실제 테이블에서 쿼리
- **인-메모리**: fixtures 배열에서 hardcoded ID로 검색
  - 성능: O(n) 검색 (배열 크기가 작으므로 문제 없음)
  - 데이터 일관성: 인-메모리는 검증 목적이므로 일관성 보장하지 않음

### 트랜잭션 안전성
- 검증 → 삽입 → 감사 로깅이 모두 같은 트랜잭션에서 실행
- 검증 실패 시: 전체 트랜잭션 롤백
- 검증 성공 후 삽입 실패 시: 자동으로 롤백됨

## 테스트 상태
- ✅ 모든 12개 테스트 파일 통과
- ✅ 총 40개 테스트 통과
- ✅ TypeScript 빌드 성공

## 외래키 관계 그래프
```
Properties (부동산)
  ├─ Tenants (임차인) - FK: propertyId
  │   └─ Contracts (계약) - FK: propertyId, tenantId
  │       └─ Payments (수납) - FK: propertyId, contractId
  ├─ Maintenance (유지보수) - FK: propertyId
  └─ Inspections (점검) - FK: propertyId
```

## 데이터 무결성 규칙

### 1단계 검증 (입력 검증)
- 필수 필드 확인
- 형식 검증 (ISO 날짜, 통화 형식 등)

### 2단계 검증 (외래키 검증)
- 참조된 엔티티 존재 확인
- 관계 일관성 확인

### 3단계 검증 (비즈니스 규칙)
- Contract: 날짜 순서, 상태 일관성
- Payment: 납부 기한, 상태 일관성
- Maintenance/Inspection: 상태 및 날짜 일관성

## 다음 단계
1. Properties 생성 엔드포인트 추가 (현재 없음)
2. 연쇄 삭제(CASCADE DELETE) 규칙 정의
   - Property 삭제 시: 연결된 모든 Tenants, Contracts, Payments, Maintenance, Inspections 삭제
   - Tenant 삭제 시: 연결된 모든 Contracts, Payments 삭제
   - Contract 삭제 시: 연결된 모든 Payments 삭제
3. 추가 비즈니스 규칙 검증
   - Tenant 및 Contract의 occupancy 업데이트 자동화
   - Payment 상태 자동 전이 (Pending → Overdue)
   - Maintenance/Inspection 상태 자동 전이

## API 엔드포인트 업데이트

### 외래키 검증이 적용된 엔드포인트
- `POST /contracts` - propertyId, tenantId 검증 ✅
- `POST /payments` - contractId 검증 ✅
- `POST /maintenance` - propertyId 검증 ✅
- `POST /inspections` - propertyId 검증 ✅

## 성능 고려사항

### 데이터베이스
- 각 CREATE 요청당 1개의 추가 SELECT 쿼리 실행
- 인덱스: `properties.id`, `tenants.id`, `contracts.id`에 자동 인덱싱
- 성능 영향: 최소화 (인덱스 조회는 O(log n))

### 인-메모리
- 검증 시 배열 순회: O(n) (배열 크기 ≤ 4이므로 무시할 수 있음)
- 메모리 영향: 무시할 수 있음

## 기술적 고려사항
- Drizzle ORM의 `eq()` 사용으로 타입 안전 보장
- 트랜잭션 내 원자성 보장
- 명확한 한국어 에러 메시지로 사용자 편의성 향상
