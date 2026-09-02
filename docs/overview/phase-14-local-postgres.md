# 14단계: 로컬 PostgreSQL 실행 구성

## 목표

개발자가 동일한 PostgreSQL 환경을 재현하고 migration과 seed를 실제로 적용할 수 있도록 실행 구성을 제공합니다.

## 구현 내용

- `infra/docker-compose.yml`에 PostgreSQL 16 Alpine 서비스를 추가했습니다.
- 데이터베이스 이름, 사용자, 비밀번호는 환경변수로 변경할 수 있습니다.
- 기본값은 로컬 개발 전용이며 저장소에 운영 자격 증명을 포함하지 않습니다.
- named volume과 healthcheck를 추가해 데이터 보존과 준비 상태 확인을 지원합니다.

## 실행 순서

Docker가 설치된 환경에서 다음 순서로 실행합니다.

```bash
docker compose -f infra/docker-compose.yml up -d
cd api
DATABASE_URL=postgresql://property_manager:property_manager_dev@localhost:5432/property_manager npm run db:migrate
DATABASE_URL=postgresql://property_manager:property_manager_dev@localhost:5432/property_manager npm run db:seed
DATABASE_URL=postgresql://property_manager:property_manager_dev@localhost:5432/property_manager npm run start:dev
```

Windows PowerShell에서는 `DATABASE_URL`을 `$env:DATABASE_URL`로 설정한 뒤 각 npm 명령을 실행합니다.

## 현재 범위

이 구성은 로컬 개발과 스테이징 검증 전용입니다. 운영 데이터베이스, CI database service, 비밀번호 보관, 백업, TLS, 네트워크 제한은 별도 운영 설계가 필요합니다.

## 검증 상태

현재 작업 환경에는 Docker와 PostgreSQL client가 없어 컨테이너 기동 및 migration 적용은 실행하지 못했습니다. Compose 파일과 기존 API 테스트·build는 검증 대상에 포함됩니다.

다음 단계: PostgreSQL 실행 환경에서 migration과 seed를 실행하고 여섯 repository의 실제 DB 조회를 확인합니다.