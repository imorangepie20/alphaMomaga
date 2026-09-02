# Phase 21: Properties POST 엔드포인트

## 목표
부동산(Properties) 생성 엔드포인트를 추가하여 부동산 데이터를 관리할 수 있도록 합니다.

## 완료된 작업

### 1. CreatePropertyInput 타입 정의
- **필드**:
  - `name` (필수): string - 부동산 이름
  - `location` (필수): string - 위치
  - `type` (필수): string - 부동산 유형 (Apartment, Townhouse, Officetel, Commercial 등)
  - `occupancy` (선택): number 0-100 - 입주율 (기본값: 0)
  - `status` (선택): PropertyStatus - 상태 (기본값: 'Active')
    - 가능한 값: 'Occupied', 'Active', 'Pending'

### 2. 검증 함수 (validateProperty)
- 이름 필수 확인 (빈 문자열 제외)
- 위치 필수 확인 (빈 문자열 제외)
- 유형 필수 확인 (빈 문자열 제외)
- 입주율 범위 검증 (0-100)
- 상태 유효성 검증 (세 가지 값 중 하나)

### 3. PropertiesService.create() 메서드
- **입력**: CreatePropertyInput, AuthenticatedPrincipal
- **처리**:
  - 입력 검증
  - 데이터베이스 트랜잭션 생성
  - 고유 ID 생성 (property-{UUID})
  - 감시 로깅: action='property.created'
- **반환**: Property 객체
- **인-메모리 모드**: 배열에 추가

### 4. PropertiesController.create() 엔드포인트
- **Method**: POST
- **Path**: `/properties`
- **Auth**: Bearer token + property:manage 권한 필수
- **Request Body**:
  ```json
  {
    "name": "새로운 부동산",
    "location": "서울, 대한민국",
    "type": "아파트",
    "occupancy": 75,
    "status": "Active"
  }
  ```
- **Response** (200):
  ```json
  {
    "id": "property-550e8400-e29b-41d4-a716-446655440000",
    "name": "새로운 부동산",
    "location": "서울, 대한민국",
    "type": "아파트",
    "occupancy": "75%",
    "status": "Active"
  }
  ```
- **Error Cases**:
  - 400: 필드 누락 또는 유효하지 않음
  - 401: 인증 없음
  - 403: 권한 부족

### 5. 단위 테스트 추가

#### PropertiesService 테스트 (8개 테스트)
- findAll(): 기존 테스트 유지
- create():
  - 모든 필드를 제공한 부동산 생성
  - 선택 필드 미제공 시 기본값 적용
  - name 누락 시 에러
  - location 누락 시 에러
  - type 누락 시 에러
  - occupancy 범위 벗어남 시 에러
  - status 유효하지 않음 시 에러
- mapPropertyRow(): 기존 테스트 유지

#### PropertiesController 테스트 (6개 테스트)
- findAll(): 모든 부동산 반환
- create():
  - 새 부동산 생성 성공
  - name 누락 시 BadRequestException
  - location 누락 시 BadRequestException
  - type 누락 시 BadRequestException
- delete(): 부동산 삭제

## API 엔드포인트

### Properties 완전 CRUD
- ✅ GET /properties - 모든 부동산 조회 (공개)
- ✅ POST /properties - 부동산 생성 (property:manage 권한 필수)
- ❌ PUT /properties/:id - 부동산 수정 (미구현)
- ✅ DELETE /properties/:id - 부동산 삭제 (property:manage 권한 필수)

## 데이터 모델

### Property 엔티티
```typescript
{
  id: string;                              // 고유 ID (property-{UUID})
  name: string;                            // 부동산 이름
  location: string;                        // 위치
  type: string;                            // 부동산 유형
  occupancy: string;                       // 입주율 (JSON: "75%", DB: 75)
  status: 'Occupied' | 'Active' | 'Pending'; // 상태
  createdAt?: Date;                        // 생성 시간 (DB 저장)
}
```

## 감시 로깅

### 부동산 생성 시 로그
```json
{
  "action": "property.created",
  "actorSubject": "user-1",
  "actorRole": "PropertyManager",
  "entityType": "property",
  "entityId": "property-550e8400-e29b-41d4-a716-446655440000",
  "metadata": {
    "name": "새로운 부동산",
    "location": "서울, 대한민국",
    "type": "아파트"
  },
  "createdAt": "2026-09-03T08:30:00Z"
}
```

## 데이터베이스 쿼리

### 부동산 생성
```sql
INSERT INTO properties (id, name, location, type, occupancy, status)
VALUES (?, ?, ?, ?, ?, ?)
RETURNING *;
```

## 비즈니스 규칙

### 필수 필드 검증
- 모든 필수 필드는 비어있지 않은 문자열이어야 함
- 입주율은 0-100 범위 내의 정수

### 기본값
- occupancy 미제공: 0%
- status 미제공: 'Active'

### 부동산 유형 (권장)
- Apartment (아파트)
- Townhouse (빌라/다세대)
- Officetel (오피스텔)
- Commercial (상업용)
- Villa (별장/숙박업)
- etc.

### 상태 정의
- **Occupied**: 임차인이 있는 상태
- **Active**: 임차인 없이 활용 가능
- **Pending**: 신규/유지보수 중

## 확장성 고려사항

### 향후 구현 예정 기능
1. PUT /properties/:id - 부동산 정보 수정 (status, occupancy 등)
2. Property 검색 및 필터링
   - ?location=서울
   - ?status=Active
   - ?type=Apartment
3. Property 통계
   - 지역별 입주율
   - 상태별 부동산 수
   - 유형별 통계

### 데이터베이스 인덱싱 (권장)
```sql
CREATE INDEX idx_properties_status ON properties(status);
CREATE INDEX idx_properties_location ON properties(location);
CREATE INDEX idx_properties_type ON properties(type);
```

## 테스트 상태
- ✅ 모든 14개 테스트 파일 통과
- ✅ 총 61개 테스트 통과
- ✅ TypeScript 빌드 성공

## 엔드포인트 사용 예시

### 1. 새 부동산 등록
```bash
curl -X POST https://api.approid.team/properties \
  -H "Authorization: Bearer {JWT_TOKEN}" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "강남 타워 주택",
    "location": "서울 강남구",
    "type": "Apartment",
    "occupancy": 85,
    "status": "Active"
  }'
```

### 2. 모든 부동산 조회
```bash
curl https://api.approid.team/properties
```

### 3. 부동산 삭제
```bash
curl -X DELETE https://api.approid.team/properties/property-1 \
  -H "Authorization: Bearer {JWT_TOKEN}"
```

## 성능 고려사항
- 각 POST 요청 시 트랜잭션 생성: 일반적으로 <10ms
- 입주율 검증: 간단한 숫자 범위 확인 (O(1))
- 부동산 생성 후 감시 로깅: 동일 트랜잭션 내에서 원자적 처리

## 보안 고려사항
- property:manage 권한 필수
- 모든 필드 입력 검증
- SQL 인젝션 방지 (Drizzle ORM 사용)
- 트랜잭션 롤백으로 일관성 보장

## 다음 단계
1. Properties PUT 엔드포인트 (수정 기능)
2. Properties 검색/필터링 기능
3. 부동산 통계 엔드포인트
4. Properties 번 삭제(벌크 삭제) 기능
5. Properties 엑스포트(CSV/JSON) 기능
