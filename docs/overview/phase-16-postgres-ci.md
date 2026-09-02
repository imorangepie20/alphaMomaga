# 16단계: PostgreSQL CI 검증

## 목표

로컬에 Docker와 PostgreSQL이 없어도 GitHub Actions에서 실제 PostgreSQL migration, seed, API e2e 흐름을 재현합니다.

## 구현 내용

- `.github/workflows/api-ci.yml`을 추가했습니다.
- API 품질 job에서 DB 없이 단위 테스트와 build를 실행합니다.
- 별도의 PostgreSQL 16 service container에서 migration과 seed를 실행합니다.
- 폐기 가능한 CI 데이터베이스에서 API e2e 테스트를 실행합니다.
- CI connection string은 workflow 내부 테스트용이며 운영 자격 증명을 포함하지 않습니다.
- 테스트 파일 간 환경변수 영향을 줄이기 위해 e2e 실행에 `--no-file-parallelism`을 사용합니다.

## 현재 범위

이 workflow는 API 검증을 대상으로 하며 프론트엔드 배포나 운영 인프라 provisioning은 포함하지 않습니다. CI 실행 시점에 고정 fixture의 lifecycle 날짜가 현재 날짜와 유효한지 확인해야 합니다.

## 검증

- workflow YAML과 문서 whitespace 검사를 수행합니다.
- 로컬 API 단위 테스트와 build는 통과했습니다.
- 현재 환경에는 Docker가 없어 PostgreSQL service container의 실제 실행은 GitHub Actions에서 확인해야 합니다.

다음 단계: GitHub Actions 실행 결과를 확인하고, PostgreSQL 기반 repository 통합 테스트와 seed 후 재시작 보존 테스트를 추가합니다.