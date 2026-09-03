# Phase 52: Auth0 Dashboard API Access Verification

## 변경 이유

`/auth/login` 이후 Auth0 callback에 `Service not found`와 `Client is not authorized to access resource server` 오류가 발생했다. 웹 애플리케이션은 `AUTH0_AUDIENCE=https://api.approid.team/`를 요청하지만, Auth0 API Resource Server와 현재 Regular Web Application의 User-Delegated Access 설정이 없었다.

## 변경 내용

- Auth0 Dashboard에서 Identifier가 `https://api.approid.team/`인 API Resource Server를 생성했다.
- 현재 Regular Web Application에 해당 API의 User-Delegated Access를 부여했다.
- `AUTH0_AUDIENCE` 값은 유지했다. audience를 제거하는 방식은 API Access Token을 발급하지 못하므로 사용하지 않는다.

## 검증

- `https://mnre.approid.team/auth/login`은 Auth0 authorization endpoint로 `307` redirect를 반환했다.
- Auth0 authorization endpoint는 tenant의 `/u/login`으로 `302` redirect를 반환했다.
- callback URL에 `error`, `error_description`, `error_code` parameter가 없음을 확인했다.

## 남은 확인

- Auth0 사용자로 Universal Login을 완료해 dashboard session과 logout을 수동 확인한다.
- Cloudflare API tunnel은 API origin을 `PORT=3100`으로 실행한 뒤 별도로 확인한다.
