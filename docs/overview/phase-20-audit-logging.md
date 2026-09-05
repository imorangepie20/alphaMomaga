# Phase 20: 감시 로깅 확장(Audit Logging Enhancement)

## 목표
감시 로그 조회 엔드포인트를 추가하여 관리자가 시스템의 모든 작업을 추적할 수 있도록 합니다.

## 2026-09-05 인증 경계 수정

- 아래 과거 구현 기록의 `user:manage` 보호 설명과 실제 동작이 달랐다. 권한 metadata만
  선언되고 `AuthGuard`, `PermissionsGuard`가 연결되지 않아 비로그인 조회가 가능했다.
  컨트롤러 메서드를 직접 호출하는 기존 단위 테스트는 가드를 실행하지 않아 이를 놓쳤다.
- 컨트롤러 전체에 두 가드를 적용하고 AuditModule이 인증·역할 모듈을 import하도록 했다.
  조회 쿼리나 감사 원본 데이터를 변경하지 않았다. 테스트에는 운영 DB를 연결하지 않았다.
- 격리 HTTP 테스트로 기존 비로그인·일반 역할 200을 먼저 재현한 뒤 비로그인 401,
  PropertyManager/Finance/Inspector 403, Admin 200과 거부 시 서비스 미호출을 확인했다.
  실제 서명 JWT에서도 미승인·만료 토큰 401, 일반 역할 403, 관리자 200을 검사했다.
- API 단위 224개, 인메모리 통합 35개 및 추가 JWT 감사 접근 검사, 빌드·린트 통과
  (기존 미사용 import 경고 3개). Cloudflare 감사 endpoint는 본문 없는 HEAD로 401 확인했다.
- 과거 외부 접근 여부와 노출 범위는 확인하지 않았다. Cloudflare/API 접근 로그와
  감사 metadata의 보관 범위를 별도로 조사해야 한다. 현 차단 성공은 과거 노출 부재의 증거가 아니다.
- 감사 조회 UI는 아직 없으며 이 보안 경계를 우선 수정했다.

## 완료된 작업

### 1. AuditService 확장
- **새로운 메서드**: `findAll(filters?: {...})`
- **필터링 옵션**:
  - `entityType` - 엔티티 타입별 필터링 (property, tenant, contract 등)
  - `entityId` - 특정 엔티티 ID별 필터링
  - `action` - 작업 유형별 필터링 (tenant.created, contract.updated 등)
  - `actorSubject` - 행동 주체(사용자)별 필터링
  - `limit` - 결과 개수 제한 (기본값: 100)
  - `offset` - 페이지네이션 오프셋 (기본값: 0)

### 2. AuditController 추가
- **엔드포인트**: `GET /admin/audit-logs`
- **권한**: `user:manage` 필수 (관리자만 접근)
- **쿼리 파라미터**:
  ```
  GET /admin/audit-logs?entityType=tenant&limit=50&offset=0
  ```
- **응답 형식**: AuditLog[]
  ```json
  {
    "id": "audit-1",
    "action": "tenant.created",
    "actorSubject": "user-1",
    "actorRole": "admin",
    "entityType": "tenant",
    "entityId": "tenant-1",
    "metadata": { "name": "John Doe", "unit": "101" },
    "createdAt": "2025-01-01T10:00:00Z"
  }
  ```

### 3. AuditModule 업데이트
- AuditController 등록
- 기존 AuditService 기능 유지

### 4. 단위 테스트 추가
- **audit.controller.spec.ts**: 6개 테스트
  - 전체 감시 로그 조회
  - entityType 필터링
  - entityId 필터링
  - action 필터링
  - actorSubject 필터링
  - 페이지네이션

- **audit.service.spec.ts**: 3개 테스트
  - 감시 이벤트 기록
  - 데이터베이스 미구성 상태에서의 빈 배열 반환
  - 필터를 포함한 빈 배열 반환

## 감시 로그 시나리오

### 예시 1: 임차인 생성 감시
```
Action: POST /tenants
Body: { "propertyId": "property-1", "name": "John Doe", "unit": "101", ... }
↓
AuditService 기록:
{
  "action": "tenant.created",
  "actorSubject": "user-1",
  "actorRole": "PropertyManager",
  "entityType": "tenant",
  "entityId": "tenant-new-id",
  "metadata": { "propertyId": "property-1", "name": "John Doe", "unit": "101" }
}
↓
관리자 조회:
GET /admin/audit-logs?entityType=tenant&entityId=tenant-new-id
```

### 예시 2: 계약 업데이트 감시
```
Action: PUT /contracts/:id
Body: { "status": "terminated", ... }
↓
AuditService 기록:
{
  "action": "contract.updated",
  "actorSubject": "user-1",
  "actorRole": "PropertyManager",
  "entityType": "contract",
  "entityId": "contract-1",
  "metadata": { "status": "terminated" }
}
↓
관리자 조회:
GET /admin/audit-logs?action=contract.updated&limit=20
```

### 예시 3: 사용자 활동 추적
```
특정 사용자의 모든 작업 조회:
GET /admin/audit-logs?actorSubject=user-1&limit=50
```

## 데이터베이스 쿼리

### 필터 없이 최신 100개 로그 조회
```sql
SELECT * FROM audit_logs
ORDER BY created_at DESC
LIMIT 100
```

### 특정 엔티티의 모든 감시 기록
```sql
SELECT * FROM audit_logs
WHERE entity_type = 'tenant' AND entity_id = 'tenant-1'
ORDER BY created_at DESC
LIMIT 100
```

### 특정 작업 유형의 모든 기록
```sql
SELECT * FROM audit_logs
WHERE action = 'tenant.created'
ORDER BY created_at DESC
LIMIT 100 OFFSET 0
```

## 성능 최적화

### 인덱싱 전략 (권장)
```sql
CREATE INDEX idx_audit_logs_entity_type ON audit_logs(entity_type);
CREATE INDEX idx_audit_logs_entity_id ON audit_logs(entity_id);
CREATE INDEX idx_audit_logs_action ON audit_logs(action);
CREATE INDEX idx_audit_logs_actor_subject ON audit_logs(actor_subject);
CREATE INDEX idx_audit_logs_created_at ON audit_logs(created_at DESC);
```

### 쿼리 성능
- 필터링 조건이 없을 때: O(log n) - created_at 인덱스 사용
- 필터링 조건이 있을 때: O(log n + k) - k는 결과 개수

### 페이지네이션
- 대량 데이터 조회 시 limit/offset으로 분할
- 권장: limit=50, offset 증가시키며 순회
- 성능: OFFSET이 높을수록 느려지므로 실제 업무에서는 cursor-based pagination 권장

## API 엔드포인트

### 감시 로그 조회
- **Method**: GET
- **Path**: `/admin/audit-logs`
- **Auth**: Bearer token (user:manage 권한 필수)
- **Query Parameters**:
  - `entityType` (optional): string
  - `entityId` (optional): string
  - `action` (optional): string
  - `actorSubject` (optional): string
  - `limit` (optional): number (기본값: 100, 최대: 1000)
  - `offset` (optional): number (기본값: 0)
- **Response**: 
  ```typescript
  AuditLog[] = {
    id: string;
    action: string;
    actorSubject: string;
    actorRole: string;
    entityType: string;
    entityId: string;
    metadata?: Record<string, unknown>;
    createdAt: Date;
  }[]
  ```

## 기술적 고려사항

### 타입 안전성
- AuditLog 타입 정의로 일관된 응답 형식 보장
- Optional 타입으로 metadata 안전성 확보

### 데이터베이스 추상화
- 데이터베이스 미구성 상태에서 빈 배열 반환
- Drizzle ORM의 type-safe 쿼리 사용

### 권한 관리
- @RequirePermission('user:manage') 데코레이터로 관리자만 접근
- 추후 audit trail 자체도 감시하지 않도록 주의 (무한 루프 방지)

### 확장성
- 필터 조건을 쉽게 추가 가능한 구조
- 이벤트 소싱(Event Sourcing) 패턴으로 확장 가능

## 테스트 상태
- ✅ 모든 13개 테스트 파일 통과
- ✅ 총 48개 테스트 통과
- ✅ TypeScript 빌드 성공

## 완전한 감시 로깅 흐름

```
사용자 요청
  ↓
API 엔드포인트 (POST/PUT/DELETE)
  ↓
비즈니스 로직
  ↓
데이터베이스 트랜잭션 시작
  ↓
데이터 쓰기 (INSERT/UPDATE/DELETE)
  ↓
AuditService.record() 호출
  ↓
audit_logs 테이블에 기록
  ↓
트랜잭션 커밋
  ↓
응답 반환
  ↓
관리자: GET /admin/audit-logs로 조회
```

## 보안 고려사항

### 권한 관리
- 감시 로그는 `user:manage` 권한 필수
- 일반 사용자는 자신의 작업만 조회 가능하도록 추후 수정 권장
  ```sql
  WHERE actor_subject = :current_user_id
  ```

### 감사 추적 자체는 감시하지 않음
- 무한 감시 루프 방지
- audit_logs 테이블 변경은 별도로 처리 필요시 trigger 사용

### 민감한 데이터 마스킹 (추후 작업)
- metadata의 민감한 정보 암호화 고려
- PII(개인식별정보) 마스킹 필요

## 다음 단계
1. 클라이언트 UI에서 감시 로그 조회 페이지 구현
2. 감시 로그 필터 UI 추가
3. 감시 로그 다운로드(CSV, JSON) 기능 추가
4. 감시 로그 분석 및 보고서 기능 추가
5. 민감한 데이터 암호화/마스킹
6. 자동 감시 로그 보관(Archiving) 정책 구현
