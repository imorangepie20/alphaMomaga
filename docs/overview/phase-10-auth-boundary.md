# 10단계: 인증 경계

## 목표

안전하지 않은 데모 자격 증명을 도입하지 않고 기존 역할 정책에 사용자 신원을 전달하는 서버 측 인증 경계를 만듭니다.

## 구현 내용

- 설정된 JWKS endpoint, issuer, audience를 기준으로 RS256 Bearer token을 검증하는 `AuthService`를 추가했습니다.
- 명시적으로 활성화한 경우에만 검증된 `x-demo-role` header를 허용하는 개발 전용 `AuthGuard` fallback을 추가했습니다.
- 확인된 인증 주체를 제공하는 `GET /auth/me`를 추가했습니다.
- 역할이 없거나 올바르지 않으면 HTTP `401`을 반환합니다.
- `NODE_ENV=production`에서는 이 임시 방식을 통한 모든 요청을 거부합니다.
- 필요한 identity provider 설정을 담은 `api/.env.example`을 추가했습니다.
- 단위 테스트와 API end-to-end 테스트를 추가했습니다.

## 현재 범위

이 단계에서는 외부에서 발급된 RS256 token을 검증하지만 로그인 token을 발급하지는 않습니다. `x-demo-role` fallback은 기본적으로 비활성화되어 있으며 로컬 개발 외부에서는 계속 비활성화해야 합니다. 다음 보안 단계에서 실제 identity provider를 연결하고 보호된 변경 작업에 guard를 적용해야 합니다.

## 검증

auth guard 단위 테스트와 API end-to-end 테스트가 통과했습니다. 평문 자격 증명은 추가하지 않았습니다.