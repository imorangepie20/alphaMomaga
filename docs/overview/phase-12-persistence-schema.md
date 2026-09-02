# 12단계: 영속화 스키마 기반

## 목표

메모리 기반 도메인 모델을 실제 관계형 데이터베이스로 옮길 수 있는 PostgreSQL 스키마와 migration 경계를 마련합니다.

## 구현 내용

- `drizzle-orm`, `drizzle-kit`, `pg` 의존성을 추가했습니다.
- `api/src/database/schema.ts`에 6개 핵심 테이블을 정의했습니다.
- 자산, 임차인, 계약, 수납, 유지보수, 점검 관계에 외래키를 적용했습니다.
- 금액 필드를 부동소수점이 아닌 원 단위 `integer`로 정의했습니다.
- 상태 값을 PostgreSQL enum으로 제한했습니다.
- `DATABASE_URL` 설정 예시와 `db:generate`, `db:migrate` 명령을 추가했습니다.
- Drizzle migration `api/drizzle/0000_gorgeous_black_queen.sql`을 생성했습니다.

## 현재 범위

현재 API 서비스는 호환성 유지를 위해 메모리 모델을 계속 사용합니다. PostgreSQL 서버와 seed 전략이 준비되기 전까지 기존 조회 및 변경 동작을 데이터베이스로 전환하지 않습니다. Docker와 `psql`이 현재 환경에 없어 migration 적용은 아직 수행하지 않았습니다.

## 검증

- API 단위 테스트: `27 passed`
- API end-to-end 테스트: `11 passed`
- API build: 통과
- Drizzle migration 생성: 6개 테이블, 외래키 확인
- 스키마와 설정 파일 진단 오류 없음

다음 단계: PostgreSQL 실행 환경을 준비하고 seed migration을 적용한 뒤 서비스 repository를 데이터베이스 조회로 교체합니다.