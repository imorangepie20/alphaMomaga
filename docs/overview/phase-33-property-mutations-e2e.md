# Phase 33: Properties mutation e2e 검증

## 목표
부동산 생성·수정·삭제 API가 실제 Nest 애플리케이션 경계에서 인증과 권한을 올바르게 적용하는지 검증합니다.

## 검증 범위

- PropertyManager의 `POST /properties`
- PropertyManager의 `PUT /properties/:id`
- PropertyManager의 `DELETE /properties/:id`
- 인증 없는 요청의 `401` 거부
- Finance 역할의 `403` 거부
- 생성 결과를 수정하고 삭제하는 전체 흐름

## 프론트엔드 전제

현재 관리자 UI의 Properties 페이지는 조회 전용이며 생성·수정 UI는 아직 없습니다. 또한 브라우저 mutation에는 Bearer 토큰을 전달하는 인증 계층이 필요합니다. 따라서 이번 단계에서는 데모 역할이 허용된 API e2e로 서버 계약을 먼저 검증합니다.

프로덕션에서는 `x-demo-role`을 사용하지 않고 실제 OAuth2/OIDC Bearer 토큰을 사용해야 합니다.

## 실행

```powershell
cd C:\Users\jowoo\alpahMomega\api
npm.cmd run test:e2e
```

## 결과

- Properties mutation e2e: **2개 통과**
- 전체 API e2e: 다음 검증에서 모든 테스트 파일을 실행
