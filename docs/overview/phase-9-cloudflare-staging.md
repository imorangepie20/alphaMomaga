# 9단계: Cloudflare 스테이징 접속

## 목표

외부 브라우저 테스트를 위해 로컬 관리자 UI와 API를 HTTPS 호스트명으로 노출합니다.

## 설정된 호스트명

- Admin UI: `https://mnre.approid.team/`
- API: `https://api.approid.team/`

브라우저 테스트의 전체 실행 순서와 오류 대응은 `docs/overview/cloudflare-browser-testing.md`를 기준으로 합니다. 브라우저에서는 항상 Cloudflare 관리자 UI 주소를 사용하며, `localhost:3000`은 터널 테스트 주소로 사용하지 않습니다.

## 운영 조건

Cloudflare Tunnel은 포트 `3001`의 로컬 Next.js 관리자 서버와 포트 `3100`의 NestJS API로 전달합니다. 두 origin 프로세스가 모두 실행 중이어야 하며, 어느 하나라도 중단되면 Cloudflare `502 Bad gateway` 응답이 발생할 수 있습니다.

## 검증

- API 호스트명이 `/properties`에 대해 네 건의 데이터를 담은 HTTP `200`을 반환했습니다.
- API origin을 재시작한 후 관리자 호스트명에서 한국어 관리 애플리케이션이 로드되었습니다.
- 앞서 발생한 `502` 응답은 애플리케이션 route 실패가 아니라 포트 `3100`에서 API origin이 대기하지 않았기 때문으로 확인했습니다.

## 현재 범위

포트폴리오 테스트를 위한 스테이징 터널입니다. 운영 배포가 아닙니다. 실제 운영에 사용하기 전에 인증, 인가 강제, 데이터베이스 영속화, 비밀정보 관리, 로깅, 프로세스 관리가 필요합니다.