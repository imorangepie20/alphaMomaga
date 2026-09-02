# Phase 22: 프로덕션 인증 제공자 설정(Production Authentication Provider Configuration)

## 목표
OAuth2/OIDC 표준을 기반으로 다양한 인증 제공자를 지원하고, 프로덕션 환경을 위한 인증 설정을 완성합니다.

## 완료된 작업

### 1. AuthConfigService 구현
- **위치**: `api/src/auth/auth-config.service.ts`
- **기능**:
  - 자동 인증 제공자 감지 (Auth0, Keycloak, Google, Custom)
  - 환경별 설정 관리 (production, staging, development)
  - 데모 모드 제어 (프로덕션에서는 비활성화)
  - 설정 검증 및 로깅

### 2. 지원하는 인증 제공자

#### Auth0
```
jwksUrl: https://YOUR_DOMAIN.auth0.com/.well-known/jwks.json
issuer: https://YOUR_DOMAIN.auth0.com/
audience: YOUR_API_IDENTIFIER
```

#### Keycloak
```
jwksUrl: https://YOUR_KEYCLOAK/auth/realms/YOUR_REALM/.well-known/openid-configuration
issuer: https://YOUR_KEYCLOAK/auth/realms/YOUR_REALM
audience: YOUR_CLIENT_ID
```

#### Google
```
jwksUrl: https://www.googleapis.com/oauth2/v3/certs
issuer: https://accounts.google.com
audience: YOUR_CLIENT_ID.apps.googleusercontent.com
```

#### Custom OAuth2/OIDC Provider
```
jwksUrl: https://your-custom-provider/.well-known/jwks.json
issuer: https://your-custom-provider/
audience: your-api
```

### 3. AuthService 강화
- **변경사항**:
  - AuthConfigService 의존성 주입
  - JWKS 캐싱으로 성능 최적화
  - 로깅 추가 (디버깅 및 모니터링)
  - 에러 처리 개선
  - getAuthProvider() / getEnvironment() 메서드 추가

### 4. 환경 설정

#### 필수 환경 변수
```bash
# 인증 설정
AUTH_JWKS_URL=https://.../.well-known/jwks.json
AUTH_ISSUER=https://your-provider/
AUTH_AUDIENCE=your-api

# 환경
NODE_ENV=production  # production, staging, development

# 선택 (개발 환경에서만 사용)
AUTH_ALLOW_DEMO_ROLE=false  # 프로덕션에서는 항상 false
```

#### 프로덕션 환경 설정 예시

**Auth0**
```bash
NODE_ENV=production
AUTH_JWKS_URL=https://myapp.auth0.com/.well-known/jwks.json
AUTH_ISSUER=https://myapp.auth0.com/
AUTH_AUDIENCE=https://api.myapp.com
```

**Keycloak**
```bash
NODE_ENV=production
AUTH_JWKS_URL=https://keycloak.myapp.com/auth/realms/myapp/.well-known/openid-configuration
AUTH_ISSUER=https://keycloak.myapp.com/auth/realms/myapp
AUTH_AUDIENCE=myapp-api
```

**Google**
```bash
NODE_ENV=production
AUTH_JWKS_URL=https://www.googleapis.com/oauth2/v3/certs
AUTH_ISSUER=https://accounts.google.com
AUTH_AUDIENCE=123456789-abc.apps.googleusercontent.com
```

### 5. 자동 제공자 감지 로직
```typescript
if (jwksUrl.includes('auth0.com') || issuer.includes('auth0.com')) {
  provider = 'auth0';
} else if (jwksUrl.includes('keycloak') || issuer.includes('keycloak')) {
  provider = 'keycloak';
} else if (jwksUrl.includes('google') || issuer.includes('google')) {
  provider = 'google';
} else {
  provider = 'custom';
}
```

### 6. 환경별 동작

#### Production
- 외부 JWKS URL 필수
- 데모 모드 비활성화 (AUTH_ALLOW_DEMO_ROLE은 무시됨)
- 모든 토큰은 발급자 및 청중자 검증 필수

#### Staging
- 외부 JWKS URL 필수
- 데모 모드 선택적 활성화 가능
- 테스트 및 통합 테스트용

#### Development
- 외부 JWKS URL 선택 사항
- 데모 모드 기본 활성화
- x-demo-role 헤더로 테스트 가능

### 7. 단위 테스트 추가

#### AuthConfigService 테스트 (15개)
- 미구성 상태 처리
- Auth0 제공자 감지
- Keycloak 제공자 감지
- Google 제공자 감지
- Custom 제공자 감지
- 환경별 설정
- 데모 모드 제어
- 프로덕션에서 데모 모드 강제 비활성화

#### AuthService 테스트 (5개)
- Bearer 토큰 없음 시 에러
- 유효하지 않은 토큰 시 에러
- 인증 제공자 정보 반환
- 환경 정보 반환
- 미구성 인증 처리

#### AuthGuard 테스트 업데이트
- AuthConfigService 의존성 추가

## 테스트 상태
- ✅ 모든 16개 테스트 파일 통과
- ✅ 총 81개 테스트 통과
- ✅ TypeScript 빌드 성공

## JWT 토큰 구조

### 필수 클레임
```json
{
  "sub": "user-123",           // 사용자 ID
  "role": "PropertyManager",   // 역할 (Admin, PropertyManager, Finance, Inspector)
  "iss": "https://...",        // 발급자 (AUTH_ISSUER와 일치 필요)
  "aud": "your-api",           // 청중자 (AUTH_AUDIENCE와 일치 필요)
  "iat": 1234567890,           // 발급 시간
  "exp": 1234571490            // 만료 시간
}
```

### 선택 클레임
```json
{
  "email": "user@example.com",
  "name": "John Doe",
  "given_name": "John",
  "family_name": "Doe",
  "picture": "https://..."
}
```

## 인증 흐름

```
사용자
  ↓
클라이언트 (웹/모바일)
  ↓
인증 제공자 (Auth0, Keycloak, Google)
  ↓
JWT 토큰 발급
  ↓
클라이언트가 API 요청 시 Bearer 토큰 포함
  ↓
API (AuthGuard)
  ↓
AuthService: Bearer 토큰 추출
  ↓
AuthConfigService: 설정 로드
  ↓
JWKS 다운로드 (캐시 사용)
  ↓
JWT 검증 (서명, 발급자, 청중자, 만료 시간)
  ↓
역할 검증 (AuthenticatedPrincipal)
  ↓
요청 처리
```

## 프로덕션 체크리스트

### 1. 인증 제공자 선택
- [ ] Auth0, Keycloak, Google, Custom 중 선택
- [ ] 제공자 계정 생성 및 설정

### 2. OAuth2/OIDC 애플리케이션 등록
- [ ] 애플리케이션/클라이언트 생성
- [ ] JWKS URL 확인
- [ ] Issuer 확인
- [ ] Audience/Client ID 설정

### 3. 환경 변수 설정
- [ ] AUTH_JWKS_URL 설정
- [ ] AUTH_ISSUER 설정
- [ ] AUTH_AUDIENCE 설정
- [ ] NODE_ENV=production 설정
- [ ] AUTH_ALLOW_DEMO_ROLE=false 확인

### 4. 검증 및 테스트
- [ ] 유효한 토큰으로 API 호출 성공
- [ ] 만료된 토큰 거부
- [ ] 잘못된 서명 거부
- [ ] 잘못된 발급자 거부
- [ ] 잘못된 청중자 거부

### 5. 보안 검토
- [ ] HTTPS 사용 (프로덕션)
- [ ] JWKS URL은 신뢰할 수 있는 제공자에서만
- [ ] 토큰 검증은 항상 서버에서
- [ ] 민감한 정보는 클라이언트에 노출 금지

### 6. 모니터링
- [ ] 인증 실패 로그 모니터링
- [ ] JWKS 다운로드 실패 감지
- [ ] 토큰 검증 성능 모니터링

## API 엔드포인트

### 인증 상태 확인
```
GET /auth/me
Authorization: Bearer {JWT_TOKEN}

Response (200):
{
  "subject": "user-123",
  "role": "PropertyManager"
}
```

## 성능 최적화

### JWKS 캐싱
- 원격 JWKS는 메모리에 캐시
- 캐시 갱신: JWKS 자동 갱신 (jose 라이브러리에서 관리)
- 성능: 토큰 검증 시간 < 1ms

### 로깅
- 인증 제공자 초기화 시 로그
- 토큰 검증 실패 시 DEBUG 로그
- 환경 정보 시작 시 로그

## 문제 해결

### "JWT authentication is not configured"
```
해결: AUTH_JWKS_URL, AUTH_ISSUER, AUTH_AUDIENCE 환경 변수 확인
```

### "The token principal is invalid"
```
해결: JWT 토큰의 sub, role 클레임 확인
역할: Admin, PropertyManager, Finance, Inspector 중 하나
```

### "The Bearer token is invalid"
```
해결: 
1. 토큰 형식 확인 (Bearer 다음 공백)
2. 토큰 서명 확인
3. 발급자(iss) 확인
4. 청중자(aud) 확인
5. 만료 시간(exp) 확인
```

### JWKS 다운로드 실패
```
해결:
1. JWKS URL 접근 가능 확인
2. 프록시/방화벽 설정 확인
3. JWKS URL 형식 확인
```

## 다음 단계

1. **OAuth2 클라이언트 라이브러리 통합**
   - 웹 클라이언트: auth0-spa-js, @okta/okta-angular
   - 모바일 클라이언트: Auth0 for Flutter, React Native

2. **사용자 정보 관리**
   - 사용자 프로필 엔드포인트 추가
   - 사용자 역할 매핑 자동화

3. **토큰 갱신(Refresh Token)**
   - 토큰 갱신 엔드포인트 추가
   - 자동 토큰 갱신 정책

4. **멀티테넌시 지원**
   - 제공자별 테넌트 분리
   - 테넌트별 권한 관리

5. **감사 로깅 강화**
   - 인증 성공/실패 로깅
   - 권한 변경 로깅

6. **SSO(Single Sign-On)**
   - 여러 애플리케이션 간 SSO
   - SAML 지원

## 참고 자료

### Auth0
- https://auth0.com/docs/secure/tokens/json-web-tokens
- https://auth0.com/docs/get-started/authentication-and-authorization-flow

### Keycloak
- https://www.keycloak.org/docs/latest/server_admin/
- https://www.keycloak.org/docs/latest/securing_apps/

### Google Identity Platform
- https://developers.google.com/identity/protocols/oauth2
- https://developers.google.com/identity/protocols/oauth2/web-server

### OAuth2 & OIDC 표준
- https://tools.ietf.org/html/rfc6749 (OAuth 2.0)
- https://openid.net/specs/openid-connect-core-1_0.html (OpenID Connect)
