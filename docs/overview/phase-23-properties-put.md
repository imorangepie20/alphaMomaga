# Phase 23: Properties PUT 엔드포인트(부동산 정보 수정)

## 목표
부동산 정보를 업데이트할 수 있는 PUT 엔드포인트를 구현합니다.

## 완료된 작업

### 1. UpdatePropertyInput 타입 추가
- **위치**: `api/src/properties/property.ts`
- **변경 사항**:
  ```typescript
  export type UpdatePropertyInput = {
    name?: string;
    location?: string;
    type?: string;
    occupancy?: number;
    status?: PropertyStatus;
  };
  ```
- 모든 필드가 선택적(optional)이므로 부분 업데이트 지원

### 2. PropertiesService.update() 메서드 구현
- **위치**: `api/src/properties/properties.service.ts`
- **기능**:
  - 최소 1개 필드 필수 (빈 객체 거부)
  - 입주율(occupancy) 검증: 0-100
  - 상태(status) 검증: 'Occupied', 'Active', 'Pending' 중 하나
  - 트랜잭션 내에서 실행 (데이터베이스 사용 시)
  - 감시 로그 자동 기록 (property.updated 이벤트)
  - 인-메모리 저장소도 지원

### 3. PropertiesController.update() 엔드포인트
- **위치**: `api/src/properties/properties.controller.ts`
- **엔드포인트**:
  ```
  PUT /properties/:id
  ```
- **권한**: @RequirePermission('property:manage')
- **요청 본문**:
  ```json
  {
    "name": "Updated Property Name",
    "occupancy": 75,
    "status": "Occupied"
  }
  ```
- **응답** (200 OK):
  ```json
  {
    "id": "property-1",
    "name": "Updated Property Name",
    "location": "Seoul, KR",
    "type": "Apartment",
    "occupancy": "75%",
    "status": "Occupied"
  }
  ```
- **에러** (400 Bad Request):
  - 빈 입력: "업데이트할 필드가 최소 하나 필요합니다"

### 4. 단위 테스트 추가
- **PropertiesService 테스트** (9개):
  - 이름 업데이트
  - 입주율과 상태 업데이트
  - 여러 필드 동시 업데이트
  - 부동산 없음 에러
  - 빈 입력 에러
  - 입주율 범위 검증 에러
  - 상태 값 검증 에러

- **PropertiesController 테스트** (2개):
  - PUT 엔드포인트 성공
  - 빈 입력 시 BadRequestException

### 5. API 사용 예시

#### 부동산 이름 수정
```bash
curl -X PUT http://localhost:3100/properties/property-1 \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{"name": "Seoul Tower A"}'
```

#### 입주율 업데이트
```bash
curl -X PUT http://localhost:3100/properties/property-1 \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{"occupancy": 85}'
```

#### 상태 변경
```bash
curl -X PUT http://localhost:3100/properties/property-1 \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{"status": "Occupied"}'
```

#### 모든 필드 업데이트
```bash
curl -X PUT http://localhost:3100/properties/property-1 \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Seoul Tower A",
    "location": "Seoul, KR (District 1)",
    "type": "Luxury Apartment",
    "occupancy": 95,
    "status": "Occupied"
  }'
```

## 구현 상세

### 검증 로직
1. **필수 필드**: 최소 1개 필드 필요
2. **입주율**: 0 <= occupancy <= 100
3. **상태**: 'Occupied' | 'Active' | 'Pending' 중 하나
4. **이름/위치/타입**: 문자열 필수 (선택적으로 제공된 경우)

### 감시 로그 기록
```typescript
{
  action: 'property.updated',
  entityType: 'property',
  entityId: 'property-id',
  metadata: {
    changes: {
      name: 'New Name',
      occupancy: 75,
      status: 'Occupied'
    }
  }
}
```

### 데이터베이스 처리
- Drizzle ORM의 `update()` 쿼리 사용
- 동적 필드 업데이트 (제공된 필드만 업데이트)
- 트랜잭션 내에서 실행
- 감시 로그도 같은 트랜잭션에 포함

### 인-메모리 저장소
- 데이터베이스 미사용 시 메모리 배열에서 업데이트
- 검증 함수로 데이터 무결성 확보

## 테스트 상태
- ✅ 모든 16개 테스트 파일 통과
- ✅ 총 90개 테스트 통과 (이전: 81개 → 추가: 9개)
- ✅ TypeScript 빌드 성공

## Properties API 완전 CRUD

| 메서드 | 엔드포인트 | 설명 |
|--------|-----------|------|
| GET | /properties | 모든 부동산 조회 |
| POST | /properties | 부동산 생성 |
| PUT | /properties/:id | 부동산 수정 ✨ (NEW) |
| DELETE | /properties/:id | 부동산 삭제 |

## 다음 단계
- Tenants PUT 엔드포인트 구현
- Contracts, Payments, Maintenance, Inspections PUT 엔드포인트
- 프론트엔드 UI 업데이트
- 통합 테스트 추가
