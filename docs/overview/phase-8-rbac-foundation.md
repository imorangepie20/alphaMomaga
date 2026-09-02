# 8단계: RBAC 기반

## 목표

인증이나 보호된 변경 작업을 도입하기 전에 서버 주도 역할과 권한을 정의합니다.

## 구현 내용

- 타입이 지정된 역할을 추가했습니다: Admin, Property Manager, Finance, Inspector.
- API에 중앙화된 권한 매트릭스를 추가했습니다.
- 재사용 가능한 정책 검사를 위해 `RolesService.can()`을 추가했습니다.
- 읽기 전용 정책 endpoint로 `GET /admin/roles`를 추가했습니다.
- 한국어 역할 화면을 fallback 데이터가 있는 서버 정책에 연결했습니다.
- 정책 단위 테스트와 API end-to-end 테스트를 추가했습니다.

## 현재 범위

이 단계에서는 아직 인증과 사용자 신원이 없으므로 요청을 인가하지 않습니다. 다음 보안 단계에서 사용할 NestJS guard를 적용할 수 있도록 정책을 준비했으며, 역할 정의를 공개한다고 권한이 부여되는 것은 아닙니다.

## 검증

Role policy unit tests, API end-to-end tests, API build, frontend lint, and browser rendering pass.

다음 단계: 인증을 추가하고 매니저와 관리자 변경 작업에 정책을 적용합니다.