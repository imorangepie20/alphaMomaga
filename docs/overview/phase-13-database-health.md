# 13단계: 데이터베이스 연결 상태

## 목표

PostgreSQL 연결을 애플리케이션에서 관찰할 수 있는 경계를 만들되, 데이터베이스가 없는 개발 환경에서도 기존 API가 정상 기동하도록 합니다.

## 구현 내용

- `DatabaseService`에 선택적 PostgreSQL 연결을 추가했습니다.
- `DATABASE_URL`이 없으면 연결을 시도하지 않고 `unconfigured` 상태를 반환합니다.
- `DATABASE_URL`이 있으면 health 확인 시 실제 `select 1` 연결 검사를 수행합니다.
- 애플리케이션 종료 시 PostgreSQL pool을 정리합니다.
- `GET /health/database` endpoint를 추가했습니다.
- Drizzle client와 기존 schema를 DatabaseService 경계에 연결했습니다.
- 6개 도메인 테이블을 기존 fixture와 동일한 ID로 채우는 idempotent `db:seed` 명령을 추가했습니다.
- seed는 자산부터 점검까지 외래키 순서로 실행하고, 금액은 원 단위 정수로 저장합니다.
- `PropertiesService`가 `DATABASE_URL` 설정 시 PostgreSQL `properties` 테이블을 조회하도록 전환했습니다.
- 데이터베이스가 설정되지 않은 개발 환경에서는 기존 메모리 fixture를 명시적으로 유지합니다.
- DB 점유율 정수 값을 기존 API 계약의 퍼센트 문자열로 변환합니다.
- `TenantsService`의 조회와 생성도 `DATABASE_URL` 설정 시 PostgreSQL을 사용하도록 전환했습니다.
- 임차인 임대료는 API의 원화 문자열을 DB의 `rent_won` 정수로 정규화합니다.
- PostgreSQL 생성 ID에 `randomUUID()`를 사용해 동시 요청 충돌을 방지합니다.

## 현재 범위

Properties와 Tenant 조회는 DB가 설정된 경우 PostgreSQL을 사용하고, 나머지 도메인 서비스는 아직 메모리 모델을 사용합니다. 따라서 이 단계는 연결 상태, 종료 lifecycle, 첫 두 도메인의 조회/생성 전환을 담당합니다. 실제 연결 테스트는 PostgreSQL 서버가 준비된 후 수행합니다. `DATABASE_URL`이 없으면 seed가 명확한 오류로 중단되며 기본 데이터베이스에 임의로 연결하지 않습니다.

## 검증

- 데이터베이스 서비스 단위 테스트: `2 passed`
- API 단위 테스트: `27 passed`
- API end-to-end 테스트: `11 passed`
- API build: 통과
- `DATABASE_URL`이 없을 때 `/health/database`가 `{ "status": "unconfigured" }` 반환
- `db:seed` 안전성 확인: `DATABASE_URL` 미설정 시 연결 없이 실패
- Properties 매핑 테스트: DB 정수 점유율을 API 퍼센트 문자열로 변환
- Tenant 금액 테스트: 원화 문자열을 정수로 저장하고 API 형식으로 복원

다음 단계: PostgreSQL 실행 환경에서 migration과 seed를 적용하고 Properties repository부터 데이터베이스 조회로 교체합니다.