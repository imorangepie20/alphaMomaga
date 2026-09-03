# 저장소 구조

## 디렉터리 역할

| 디렉터리 | 역할 | 작업 기준 |
|---|---|---|
| `api/` | NestJS 부동산 관리 백엔드 | API, 도메인 로직, DB, 인증, e2e |
| `web/` | 실제 부동산 관리 관리자 프론트엔드 | 페이지, 컴포넌트, API 클라이언트, 브라우저 테스트 |
| `SDTPL_ADM/` | 관리자 UI 테마 참고용 원본 | 참고만 함. 애플리케이션 기능을 추가하지 않음 |
| `infra/` | 로컬 및 배포 인프라 | Docker Compose, 환경 설정 |
| `docs/` | 설계·운영·단계 문서 | 구현 위치와 실행 절차 기록 |
| `.github/` | 저장소 지침 및 CI | 워크플로와 에이전트 규칙 |

## 프론트엔드 원칙

- 모든 실제 프론트엔드 변경은 `web/`에서 수행합니다.
- `SDTPL_ADM/`은 디자인과 UI 컴포넌트 참고용으로 보존합니다.
- `web/`은 `SDTPL_ADM/`을 기반으로 구성되었지만 독립적인 애플리케이션 소스입니다.
- 테마 수정이 필요할 때만 `SDTPL_ADM/`을 직접 변경합니다.

## 실행 포트

- 관리자 프론트엔드: `web/`, 로컬 `3001`
- API: `api/`, 로컬 `3100`
- Cloudflare 관리자 주소: `https://mnre.approid.team/`
- Cloudflare API 주소: `https://api.approid.team/`

Cloudflare Tunnel의 관리자 origin은 `web`으로 전환한 뒤 공식 브라우저 테스트에 사용합니다. 전환 전에는 기존 origin을 변경하지 않습니다.
