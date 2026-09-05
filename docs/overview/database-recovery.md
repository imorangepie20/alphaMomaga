# 데이터베이스 백업·복원

## 안전 원칙

- 운영 DB에 seed, 테스트, 복원 명령을 실행하지 않는다.
- 복원은 별도로 생성한 빈 DB에 수행한다. 운영 DB 삭제나 덮어쓰기는 이 절차에 없다.
- DB 비밀번호, 접속 문자열 및 실제 고객 데이터가 든 백업은 Git에 넣지 않는다.
- 실제 운영 백업은 암호화된 외부 저장소와 접근 통제, 보존 기간, 성공·실패 알림이 필요하다.
  현재 저장소에는 예약 백업·외부 보관 자동화가 구현되어 있지 않다.

## 복원 리허설 절차

1. 운영과 분리된 PostgreSQL 컨테이너 및 임시 원본 DB를 만든다.
   호스트 포트는 `127.0.0.1`로만 공개하고 기존 볼륨은 연결하지 않는다.
2. 임시 원본의 `DATABASE_URL`을 해당 PowerShell 프로세스에만 지정한다.
   `api` 디렉터리에서 `npm.cmd run db:migrate`와 `npm.cmd run db:seed`를 실행한다.
3. 동일한 임시 DB를 `TEST_DATABASE_URL`로 지정하고 PostgreSQL 수납 통합 테스트를 실행한다.
4. 컨테이너 안에서 다음 명령을 실행한다. 예시의 DB 이름은 임시 DB 전용이다.

```text
pg_dump -U postgres -d backup_source --format=custom --file=/tmp/readiness.dump
createdb -U postgres backup_restored
pg_restore -U postgres -d backup_restored --exit-on-error --no-owner /tmp/readiness.dump
```

5. 원본과 복원 DB에서 아래 쿼리를 테이블별로 실행해 결과를 비교한다.
   테이블 이름은 확인된 스키마 목록에서만 대입한다. 지문은 내용 비교용이며 보안 서명이 아니다.

```sql
select count(*)::text || ':' ||
  md5(coalesce(string_agg(row_to_json(t)::text, '|' order by id), ''))
from properties t;
```

6. `properties`, `tenants`, `contracts`, `payments`, `monthly_charges`,
   `payment_receipts`, `payment_allocations`, `maintenance`, `inspections`, `audit_logs`를 비교한다.
   `drizzle.__drizzle_migrations`의 이력 수도 확인한다.
7. 복원 DB에서 migration 재실행 및
   `npm.cmd run test:e2e -- billing-postgres.e2e-spec.ts --no-file-parallelism`을 실행한다.
   이 단계는 복원 내용에 테스트 데이터를 추가하므로 지문 비교 후 수행한다.
8. 이번에 만든 임시 컨테이너의 이름과 용도 label을 확인하고 정리한다.
   실제 백업·운영 컨테이너를 정리 대상으로 삼지 않는다.

## 2026-09-05 결과

- 별도 `postgres:16-alpine` 임시 컨테이너에서 수행. 운영 DB 접근·변경 없음.
- custom-format 백업 및 빈 DB 복원 성공.
- 10개 테이블의 행 수 및 내용 지문 일치:
  자산 4, 임차인 4, 계약 4, 기존 결제 4, 월별 청구 4,
  영수증 2, 배분 2, 정비 4, 점검 4, 감사 기록 9개.
- migration 이력 3개 보존, 복원 후 migration 재실행 성공.
- 복원 DB에서 수납 저장·동시 생성·과배분 차단·동시 void·API 재생성 검증 통과.

## 운영 전 남은 사항

실제 장애 상황의 복구 시간과 허용 데이터 손실 범위는 이번 소규모 리허설로 입증되지 않았다.
운영 데이터 규모를 반영한 복원 시간 측정, 암호화 외부 저장소, 백업 주기·보존 기간,
장애 알림과 복구 담당자, Auth0·환경 설정의 별도 복구 절차를 확정해야 한다.
이번 PostgreSQL 백업에는 Auth0 테넌트 계정·설정이나 `.env` 파일이 포함되지 않는다.
