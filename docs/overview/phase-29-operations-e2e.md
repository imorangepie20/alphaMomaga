# Phase 29: 운영 API CRUD 통합 검증

## 목표
Maintenance와 Inspection의 보호된 생성·수정 API를 실제 Nest 애플리케이션 경계에서 검증합니다.

## 검증 범위

- `GET /maintenance` 및 `GET /inspections` 조회
- PropertyManager의 Maintenance POST/PUT
- PropertyManager의 Inspection POST/PUT
- 인증되지 않은 요청의 `401` 거부
- 권한이 없는 Finance 요청의 `403` 거부
- 잘못된 날짜 입력의 `400` 거부

## 테스트 환경 주의사항

Operations e2e는 데모 역할 헤더를 사용하므로 테스트 앱 초기화 전에 다음 환경 변수를 설정합니다.

```powershell
$env:AUTH_ALLOW_DEMO_ROLE = 'true'
```

이 설정이 없으면 `x-demo-role` 헤더가 인증되지 않아 권한 테스트가 `401`로 종료됩니다. 프로덕션 환경에서는 데모 역할을 사용하지 않습니다.

## 실행

```powershell
cd C:\Users\jowoo\alpahMomega\api
npm.cmd run test:e2e
```

## 결과

- e2e 테스트 파일: 8개 통과
- e2e 테스트: 16개 통과
- API 빌드: 성공

## 관련 파일

- `api/test/operations.e2e-spec.ts`
- `api/src/maintenance/maintenance.controller.ts`
- `api/src/inspections/inspections.controller.ts`
