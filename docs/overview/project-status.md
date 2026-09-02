# 프로젝트 상태

## 현재 상태

- 저장소 루트에 `web` 아래의 Next.js 앱이 있는 작업 공간이 구성되어 있습니다.
- `api` 아래에 NestJS API 앱이 있습니다.
- `SDTPL_ADM`에 UI 기반으로 사용할 수 있는 사전 제작 관리자 템플릿이 있습니다.
- 이 템플릿은 레이아웃, 네비게이션, 차트 위젯을 제공하는 shadcn 스타일 관리자 대시보드 시스템입니다.

## 의미

다음 요소를 갖춘 부동산 관리 애플리케이션의 기반이 마련되었습니다.

- 현대적인 대시보드 UI
- 백엔드 API 기반
- 재사용 가능한 관리자 디자인 시스템

## 현재 구현 상태

관리자 템플릿을 `SDTPL_ADM` 아래의 한국어 부동산 관리 애플리케이션으로 전환했으며, `api` 아래의 NestJS API가 이를 지원합니다.

완료된 업무 흐름 단위:

1. 매물 포트폴리오 조회와 점유율 지표
2. 임차인 기록과 수납 상태 지표
3. ISO 날짜 및 lifecycle 검증을 포함한 계약 조회
4. 금액, 납부 예정일, 상태 검증을 포함한 수납 조회
5. 운영 상태 검증을 포함한 유지보수 작업 요청과 점검 기록
6. 서버 주도 역할 및 권한 정책 정의
7. 명시적으로 선택 가능한 로컬 demo fallback을 포함한 서명 Bearer JWT 인증 경계
8. `401`, `403`, `400`을 구분하는 RBAC 보호 임차인 생성
9. PostgreSQL Drizzle 스키마와 6개 핵심 운영 테이블 migration 생성
10. 선택적 PostgreSQL 연결과 `GET /health/database` 상태 확인 endpoint
11. 6개 도메인 테이블을 채우는 idempotent `db:seed` 명령
12. `DATABASE_URL` 설정 시 PostgreSQL을 조회하는 Properties 첫 repository 전환

관리자 UI는 한국어 우선으로 구성되어 있습니다. 네비게이션, 대시보드 라벨, breadcrumb, 공용 셸 라벨, 운영 페이지, 관리자 역할 화면에 한국어 용어를 사용합니다.

## 실행 endpoint

- Local admin UI: `http://localhost:3001`
- Local API: `http://localhost:3100`
- Cloudflare admin UI: `https://mnre.approid.team/`
- Cloudflare API: `https://api.approid.team/`

Cloudflare 호스트명은 로컬 서비스에 대한 스테이징 접속 지점이며 운영 배포가 아닙니다. tunnel route가 응답하려면 API origin이 계속 실행 중이어야 합니다.

## 핵심 작업 영역

1. 부동산 관리 대시보드 맞춤화
2. 자산, 임차인, 계약, 수납, 유지보수 도메인 모델 정의
3. 인증과 역할 기반 접근 제어
4. CRUD API와 데이터 영속화
5. 관리자와 매니저 업무 흐름
6. 범위 확장 전 검증과 버그 수정

## 검증 상태

- API 단위 테스트: `23 passed`
- API end-to-end 테스트: `6 passed`
- API build: 통과
- 관리자 프론트엔드 lint: 통과
- 브라우저 검증: 대시보드, 매물, 임차인, 계약, 수납, 유지보수, 점검, 역할 화면을 정상 렌더링
- 브라우저 hydration 경고: 캘린더 날짜 형식을 결정적으로 변경한 후 없음
- 공개 API smoke test: `https://api.approid.team/properties`가 네 건의 매물 기록과 함께 HTTP `200` 반환
- API origin 재시작 후 공개 관리자 호스트명 복구. 이전 Cloudflare `502`는 중단된 로컬 API 서비스가 원인이었음
- 인증 경계 테스트: 유효 역할 주체, 역할 누락 거부, 서명 JWT 설정 경로를 단위/e2e 테스트로 검증
- 보호된 변경 테스트: Property Manager는 임차인 생성 가능, Finance는 `403` 거부, 잘못된 입력은 `400` 반환
- 영속화 스키마: Drizzle migration 생성 및 6개 테이블과 외래키 확인. 적용은 PostgreSQL 서버 준비 후 진행
- 데이터베이스 health: `DATABASE_URL`이 없을 때 `unconfigured` 응답, 설정된 경우 연결 검사와 pool 종료 lifecycle 제공
- 데이터베이스 seed: 기존 fixture를 외래키 순서로 반복 적용하며, `DATABASE_URL`이 없으면 실행하지 않음
- Properties repository: DB 설정 시 `properties` 테이블 조회, 미설정 시 명시적 메모리 fixture 사용

## 규칙

- 의미 있는 모든 변경을 문서에 기록합니다.
- 필요한 작업을 미루지 않습니다.
- 개별 부분을 수정하기 전에 전체 흐름을 이해합니다.
- 다음 단계로 넘어가기 전에 각 단계를 검증합니다.

## 다음 구현 단위

PostgreSQL migration과 seed를 실제 환경에 적용하고 나머지 도메인 repository를 데이터베이스 조회로 교체한 뒤 감사 기록과 보호된 쓰기 작업을 확장합니다.
