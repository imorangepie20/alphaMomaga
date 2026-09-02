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

## 현재 범위

기존 도메인 서비스는 아직 메모리 모델을 사용합니다. 따라서 이 단계는 연결 상태와 종료 lifecycle만 담당하며, 데이터 조회와 임차인 생성은 아직 PostgreSQL에 저장되지 않습니다. 실제 연결 테스트는 PostgreSQL 서버가 준비된 후 수행합니다.

## 검증

- 데이터베이스 서비스 단위 테스트: `2 passed`
- API 단위 테스트: `27 passed`
- API end-to-end 테스트: `11 passed`
- API build: 통과
- `DATABASE_URL`이 없을 때 `/health/database`가 `{ "status": "unconfigured" }` 반환

다음 단계: PostgreSQL 실행 환경에서 migration과 seed를 적용하고 Properties repository부터 데이터베이스 조회로 교체합니다.