# Phase 50: 로컬 PostgreSQL 적용

## 변경 이유

API의 영속화 구현과 Drizzle 마이그레이션은 준비되어 있었지만, 로컬 개발
환경에서는 PostgreSQL 컨테이너, 스키마, 시드 데이터가 실제로 적용되지 않은
상태였다. 이 상태에서는 메모리 폴백 경로만 검증될 수 있어 영속화 동작을
신뢰할 수 없었다.

## 근본 원인

Docker Desktop 설치 이후 WSL2 백엔드를 사용할 수 있어야 한다. 초기에는
WSL이 설치되지 않아 Docker 엔진을 시작할 수 없었고, 재부팅 후 WSL2의
`docker-desktop` 배포판이 실행되면서 엔진이 준비됐다. PowerShell 실행
정책은 `npm.ps1` 실행만 막았으므로 전역 정책을 변경하지 않고 `npm.cmd`를
사용했다.

## 적용 내용

- Docker Desktop의 WSL2 Linux 엔진을 사용하도록 로컬 환경을 준비했다.
- `infra/docker-compose.yml`로 `postgres:16-alpine` 컨테이너를 실행했다.
- `property-manager-postgres` 컨테이너와
  `infra_property-manager-postgres-data` 영속 볼륨을 생성했다.
- `DATABASE_URL=<LOCAL_POSTGRES_URL>`
  환경 변수로 `api`의 Drizzle 마이그레이션과 시드를 적용했다.
- 검증용 API를 `PORT=3102`에서 일시 실행한 후 종료했다. 기존 3100 포트의
  사용자 실행 프로세스는 변경하지 않았다.

## 검증 결과

- Docker CLI client/server: `29.7.2`
- `property-manager-postgres` healthcheck: `healthy`
- 생성 테이블: `properties`, `tenants`, `contracts`, `payments`, `maintenance`,
  `inspections`, `audit_logs`
- 시드 확인: `properties=4`, `tenants=4`, `contracts=4`
- `GET http://127.0.0.1:3102/properties`: PostgreSQL 기반 property 4건 반환
- `npm.cmd --prefix api run build`: 통과
- `npm.cmd --prefix api run test`: 18개 파일, 125개 테스트 통과

## 운영 메모

로컬 컨테이너 중지는 `docker compose -f infra/docker-compose.yml stop`으로
수행한다. 데이터까지 초기화해야 하는 경우에만 볼륨을 제거하며, 일반 개발
중에는 영속 볼륨을 유지한다.
