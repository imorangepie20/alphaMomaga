# 60단계: PostgreSQL 수납 원장 시드 검증

## 검증 환경

- 로컬 개발 컨테이너: `property-manager-postgres`
- 데이터베이스: `property_manager`
- 실행일: 2026-09-04

## 실행 결과

아래 명령을 개발 컨테이너에만 적용했다.

```powershell
$env:DATABASE_URL = 'postgresql://property_manager:property_manager_dev@localhost:5432/property_manager'
npm.cmd run db:migrate --prefix api
npm.cmd run db:seed --prefix api
```

`monthly_charges` 조회 결과는 `2026-09` 청구월에 대해 다음 네 상태를 반환했다.

| 상태 | 청구 | 수납 | 미수 |
| --- | ---: | ---: | ---: |
| `Paid` | 1,200,000 | 1,200,000 | 0 |
| `Overdue` | 980,000 | 0 | 980,000 |
| `PartiallyPaid` | 1,540,000 | 500,000 | 1,040,000 |
| `Draft` | 1,020,000 | 0 | 1,020,000 |

시드는 계약별 월별 청구의 유일 제약과 영수증·배분 외래 키를 통과했다. 이 데이터는
개발용 fixture이며 운영 데이터에 `db:seed`를 실행해서는 안 된다.

