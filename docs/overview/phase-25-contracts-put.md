# Phase 25: Contracts PUT 엔드포인트(계약 정보 수정)

## 목표
계약 정보를 업데이트할 수 있는 PUT 엔드포인트를 구현합니다.

## 완료된 작업

### 1. UpdateContractInput 타입 확인
- **위치**: `api/src/contracts/contract.ts`
- **기능**:
  ```typescript
  export type UpdateContractInput = {
    status?: ContractStatus;
    terminatedAt?: string;
  };
  ```
- 상태와 종료일시만 업데이트 가능 (계약의 핵심 정보는 불변)

### 2. ContractsService.update() 메서드 확인
- **위치**: `api/src/contracts/contracts.service.ts`
- **기능**:
  - 계약 상태 변경 (Upcoming, Active, Expired, Terminated)
  - 종료 날짜 기록 (Terminated 상태일 때)
  - 트랜잭션 내에서 실행 (데이터베이스 사용 시)
  - 감시 로그 자동 기록 (contract.updated 이벤트)
  - 인-메모리 저장소도 지원

### 3. ContractsController.update() 엔드포인트 확인
- **위치**: `api/src/contracts/contracts.controller.ts`
- **엔드포인트**:
  ```
  PUT /contracts/:id
  ```
- **권한**: @RequirePermission('contract:manage')
- **요청 본문**:
  ```json
  {
    "status": "Expired"
  }
  ```
  또는
  ```json
  {
    "status": "Terminated",
    "terminatedAt": "2026-06-15"
  }
  ```
- **응답** (200 OK):
  ```json
  {
    "id": "contract-1",
    "propertyId": "property-1",
    "tenantId": "tenant-1",
    "unit": "A-101",
    "monthlyRent": "₩1,200,000",
    "startDate": "2026-01-01",
    "endDate": "2027-08-31",
    "status": "Expired"
  }
  ```

### 4. 단위 테스트 추가

#### ContractsService 테스트 (4개)
- 계약 상태 업데이트
- Terminated 상태 시 종료 날짜 기록
- 상태만 업데이트 (종료 날짜 없음)
- 계약 없음 에러

#### ContractsController 테스트 (2개)
- PUT 엔드포인트 성공
- 서비스 에러 처리

### 5. API 사용 예시

#### 계약 상태를 Active로 변경
```bash
curl -X PUT http://localhost:3100/contracts/contract-1 \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{"status": "Active"}'
```

#### 계약 상태를 Expired로 변경
```bash
curl -X PUT http://localhost:3100/contracts/contract-1 \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{"status": "Expired"}'
```

#### 계약 종료 (Terminated 상태)
```bash
curl -X PUT http://localhost:3100/contracts/contract-1 \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{
    "status": "Terminated",
    "terminatedAt": "2026-06-15"
  }'
```

## 구현 상세

### 계약 상태 라이프사이클
1. **Upcoming** - 계약이 시작되기 전
2. **Active** - 계약이 진행 중
3. **Expired** - 계약이 자연 만료됨
4. **Terminated** - 계약이 조기 종료됨

### 감시 로그 기록
```typescript
{
  action: 'contract.updated',
  entityType: 'contract',
  entityId: 'contract-id',
  metadata: {
    changes: {
      status: 'Terminated',
      terminatedAt: '2026-06-15'
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
- 상태와 종료 날짜만 변경

## 테스트 상태
- ✅ 모든 18개 테스트 파일 통과
- ✅ 총 113개 테스트 통과 (이전: 104개 → 추가: 9개)
- ✅ TypeScript 빌드 성공

## Contracts API 완전 CRUD

| 메서드 | 엔드포인트 | 설명 |
|--------|-----------|------|
| GET | /contracts | 모든 계약 조회 |
| POST | /contracts | 계약 생성 |
| PUT | /contracts/:id | 계약 수정 ✨ (NOW COMPLETE) |

주의: DELETE는 구현하지 않음 (계약은 기록으로 유지)

## API 완성 현황

### 부동산 (Properties)
- ✅ GET /properties - 조회
- ✅ POST /properties - 생성
- ✅ PUT /properties/:id - 수정
- ✅ DELETE /properties/:id - 삭제

### 임차인 (Tenants)
- ✅ GET /tenants - 조회
- ✅ POST /tenants - 생성
- ✅ PUT /tenants/:id - 수정
- ✅ DELETE /tenants/:id - 삭제

### 계약 (Contracts)
- ✅ GET /contracts - 조회
- ✅ POST /contracts - 생성
- ✅ PUT /contracts/:id - 수정
- ❌ DELETE (구현 안 함 - 감사 기록 유지)

### 수납 (Payments)
- ✅ GET /payments - 조회
- ✅ POST /payments - 생성
- ✅ PUT /payments/:id - 수정
- ❌ DELETE (구현 안 함)

### 유지보수 (Maintenance)
- ✅ GET /maintenance - 조회
- ✅ POST /maintenance - 생성
- ✅ PUT /maintenance/:id - 수정
- ❌ DELETE (구현 안 함)

### 점검 (Inspections)
- ✅ GET /inspections - 조회
- ✅ POST /inspections - 생성
- ✅ PUT /inspections/:id - 수정
- ❌ DELETE (구현 안 함)

## 다음 단계
- 프론트엔드 UI 통합 (Dashboard, CRUD forms)
- 통합 테스트 추가 (API 엔드-투-엔드)
- 성능 최적화 및 캐싱
- 배포 환경 설정
