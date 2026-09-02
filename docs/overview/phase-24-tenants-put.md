# Phase 24: Tenants PUT 엔드포인트(임차인 정보 수정)

## 목표
임차인 정보를 업데이트할 수 있는 PUT 엔드포인트를 구현합니다.

## 완료된 작업

### 1. UpdateTenantInput 타입 추가
- **위치**: `api/src/tenants/tenant.ts`
- **변경 사항**:
  ```typescript
  export type UpdateTenantInput = {
    name?: string;
    unit?: string;
    rent?: number;
    status?: TenantPaymentStatus;
  };
  ```
- 모든 필드가 선택적(optional)이므로 부분 업데이트 지원

### 2. TenantsService.update() 메서드 구현
- **위치**: `api/src/tenants/tenants.service.ts`
- **기능**:
  - 최소 1개 필드 필수 (빈 객체 거부)
  - 임차료(rent) 검증: 양의 정수 필수
  - 상태(status) 검증: 'Paid', 'Overdue', 'Pending' 중 하나
  - 같은 부동산 내 중복 unit 검증 (다른 임차인이 이미 사용 중)
  - 트랜잭션 내에서 실행 (데이터베이스 사용 시)
  - 감시 로그 자동 기록 (tenant.updated 이벤트)
  - 인-메모리 저장소도 지원

### 3. TenantsController.update() 엔드포인트
- **위치**: `api/src/tenants/tenants.controller.ts`
- **엔드포인트**:
  ```
  PUT /tenants/:id
  ```
- **권한**: @RequirePermission('tenant:manage')
- **요청 본문**:
  ```json
  {
    "name": "Updated Tenant Name",
    "rent": 1500000,
    "status": "Paid"
  }
  ```
- **응답** (200 OK):
  ```json
  {
    "id": "tenant-1",
    "name": "Updated Tenant Name",
    "propertyId": "property-1",
    "unit": "A-101",
    "rent": "₩1,500,000",
    "status": "Paid"
  }
  ```
- **에러** (400 Bad Request):
  - 빈 입력: "업데이트할 필드가 최소 하나 필요합니다"
  - 유효하지 않은 상태: "Invalid status value"
  - 중복 unit: "같은 부동산의 {unit}에 이미 임차인이 있습니다"

### 4. 단위 테스트 추가

#### TenantsService 테스트 (8개)
- 임차인 이름 업데이트
- 임차료 업데이트
- 상태 업데이트
- 여러 필드 동시 업데이트
- 임차인 없음 에러
- 빈 입력 에러
- 상태 값 검증 에러
- 같은 부동산 내 중복 unit 검증

#### TenantsController 테스트 (3개)
- PUT 엔드포인트 성공
- 빈 입력 시 BadRequestException
- 서비스 에러 처리

### 5. API 사용 예시

#### 임차인 이름 수정
```bash
curl -X PUT http://localhost:3100/tenants/tenant-1 \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{"name": "Park Minseo"}'
```

#### 임차료 업데이트
```bash
curl -X PUT http://localhost:3100/tenants/tenant-1 \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{"rent": 1500000}'
```

#### 지불 상태 변경
```bash
curl -X PUT http://localhost:3100/tenants/tenant-1 \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{"status": "Paid"}'
```

#### 호실 변경
```bash
curl -X PUT http://localhost:3100/tenants/tenant-1 \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{"unit": "A-102"}'
```
(단, 같은 부동산 내에서 호실 중복이 없어야 함)

#### 모든 필드 업데이트
```bash
curl -X PUT http://localhost:3100/tenants/tenant-1 \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Park Minseo",
    "unit": "B-101",
    "rent": 2000000,
    "status": "Paid"
  }'
```

## 구현 상세

### 검증 로직
1. **필수 필드**: 최소 1개 필드 필요
2. **임차료**: 양의 정수 (₩ 형식으로 변환)
3. **상태**: 'Paid' | 'Overdue' | 'Pending' 중 하나
4. **호실 중복**: 같은 propertyId 내에서 unit 중복 불가 (다른 임차인의 경우)

### 감시 로그 기록
```typescript
{
  action: 'tenant.updated',
  entityType: 'tenant',
  entityId: 'tenant-id',
  metadata: {
    changes: {
      name: 'Updated Name',
      rent: 1500000,
      status: 'Paid'
    }
  }
}
```

### 데이터베이스 처리
- Drizzle ORM의 `update()` 쿼리 사용
- 동적 필드 업데이트 (제공된 필드만 업데이트)
- 트랜잭션 내에서 실행
- 호실 중복 검증도 같은 트랜잭션에 포함

### 인-메모리 저장소
- 데이터베이스 미사용 시 메모리 배열에서 업데이트
- 호실 중복 검증 포함
- 임차료 형식 변환 (숫자 → ₩ 포맷)

## 테스트 상태
- ✅ 모든 17개 테스트 파일 통과
- ✅ 총 104개 테스트 통과 (이전: 90개 → 추가: 14개)
- ✅ TypeScript 빌드 성공

## Tenants API 완전 CRUD

| 메서드 | 엔드포인트 | 설명 |
|--------|-----------|------|
| GET | /tenants | 모든 임차인 조회 |
| POST | /tenants | 임차인 생성 |
| PUT | /tenants/:id | 임차인 수정 ✨ (NEW) |
| DELETE | /tenants/:id | 임차인 삭제 |

## Properties & Tenants CRUD 완성

### Properties CRUD ✅
- GET /properties - 모든 부동산 조회
- POST /properties - 부동산 생성
- PUT /properties/:id - 부동산 수정
- DELETE /properties/:id - 부동산 삭제

### Tenants CRUD ✅
- GET /tenants - 모든 임차인 조회
- POST /tenants - 임차인 생성
- PUT /tenants/:id - 임차인 수정
- DELETE /tenants/:id - 임차인 삭제

## 다음 단계
- Contracts PUT 엔드포인트 구현
- Payments PUT 엔드포인트 구현
- Maintenance PUT 엔드포인트 구현
- Inspections PUT 엔드포인트 구현
- 프론트엔드 UI 통합
