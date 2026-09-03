# 프로젝트 상태

## 현재 상태

- 저장소 루트에 `web` 아래의 Next.js 앱이 있는 작업 공간이 구성되어 있습니다.
- `api` 아래에 NestJS API 앱이 있습니다.
- `SDTPL_ADM`에 UI 기반으로 사용할 수 있는 사전 제작 관리자 테마가 있습니다. 이 폴더는 참고용 원본이며 애플리케이션 코드의 대상이 아닙니다.
- `web`에 테마를 바탕으로 구성한 실제 부동산 관리 관리자 프론트엔드가 있습니다.
- 이 템플릿은 레이아웃, 네비게이션, 차트 위젯을 제공하는 shadcn 스타일 관리자 대시보드 시스템입니다.

## 의미

다음 요소를 갖춘 부동산 관리 애플리케이션의 기반이 마련되었습니다.

- 현대적인 대시보드 UI
- 백엔드 API 기반
- 재사용 가능한 관리자 디자인 시스템

## 현재 구현 상태

`web` 아래의 한국어 부동산 관리 프론트엔드와 `api` 아래의 NestJS API가 애플리케이션을 구성합니다. `SDTPL_ADM`은 테마 참고용으로 보존합니다.

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
13. `DATABASE_URL` 설정 시 PostgreSQL을 사용하는 Tenant 조회·생성 repository 전환
14. `DATABASE_URL` 설정 시 PostgreSQL을 조회하는 Contract repository 전환
15. `DATABASE_URL` 설정 시 PostgreSQL을 조회하는 Payment repository 전환
16. `DATABASE_URL` 설정 시 PostgreSQL을 조회하는 Maintenance·Inspection repository 전환
17. 로컬 PostgreSQL 실행을 위한 Docker Compose 구성
18. 보호된 임차인 생성과 연결된 `audit_logs` transaction 기록
19. GitHub Actions PostgreSQL service 기반 API migration/seed/e2e 검증
20. 계약(Contract), 수납(Payment), 유지보수(Maintenance), 점검(Inspection) 엔티티에 대한 데이터베이스 기반 POST/PUT 엔드포인트
21. Properties/Tenants DELETE 엔드포인트 및 임차인 중복 검증(같은 propertyId+unit 조합)
22. 외래키 검증: Contract는 propertyId/tenantId, Payment는 contractId, Maintenance/Inspection은 propertyId 확인
23. 감시 로그 조회 엔드포인트(`GET /admin/audit-logs`)와 필터링/페이지네이션 지원
24. Properties POST 엔드포인트로 부동산 생성 기능 추가
25. 프로덕션 인증 제공자 설정(Auth0, Keycloak, Google 등)과 AuthConfigService
26. Properties PUT 엔드포인트로 부동산 정보 수정 기능(이름, 위치, 상태, 입주율)
27. Tenants PUT 엔드포인트로 임차인 정보 수정 기능(이름, 호실, 임차료, 지불상태)
28. Contracts PUT 엔드포인트로 계약 상태 및 종료일 수정 기능
29. Payments PUT 업데이트의 원자적 검증 및 잘못된 상태 변경 방지
30. Maintenance PUT 업데이트의 원자적 날짜 검증 및 실패 시 상태 보존
31. Cloudflare Tunnel 브라우저 테스트 절차와 origin 포트/502 대응 문서화
32. Inspections PUT 업데이트의 원자적 완료일 검증 및 실패 시 상태 보존
33. Maintenance/Inspection 보호된 POST·PUT 운영 API e2e 통합 검증
34. Playwright의 Cloudflare staging 외부 주소 실행 설정 및 대시보드 브라우저 검증
35. Cloudflare 관리자 UI와 공개 Properties API 데이터 연동 브라우저 검증
36. Tenants/Contracts/Payments/Maintenance/Inspections API 데이터 연동 브라우저 검증
37. Properties 생성·수정·삭제 API의 인증/권한 e2e 통합 검증
38. Properties 관리자 화면의 생성·수정 UI와 Bearer 토큰 전송 연결
39. 실제 프론트엔드를 `web`으로 분리하고 `SDTPL_ADM`을 테마 참고 원본으로 고정
40. `web` 프론트엔드 CI(lint/build) 추가 및 불안정한 테마 e2e의 별도 실행 분리
41. 한국어 운영 대시보드 Playwright 기대값 정리 및 3개 브라우저 테스트 통과
42. `web` Properties 핵심 업무 화면 e2e와 3001/API origin 기본값 검증
43. `web` 임차인·계약·수납·유지보수·점검 운영 페이지 e2e 검증

관리자 UI는 한국어 우선으로 구성되어 있습니다. 네비게이션, 대시보드 라벨, breadcrumb, 공용 셸 라벨, 운영 페이지, 관리자 역할 화면에 한국어 용어를 사용합니다.

## 실행 endpoint

- Local admin UI: `http://localhost:3001` (`web` 디렉터리)
- Local API: `http://localhost:3100`
- Cloudflare admin UI: `https://mnre.approid.team/`
- Cloudflare API: `https://api.approid.team/`

브라우저 테스트는 `docs/overview/cloudflare-browser-testing.md`의 Cloudflare 주소를 기준으로 진행합니다. 현재 Tunnel origin을 `web`의 `3001` 포트로 전환하는 작업이 필요하며, `localhost:3000`은 사용하지 않습니다.

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
- Tenant repository: DB 설정 시 조회·생성 수행, 원화 문자열과 `rent_won` 정수 변환, 미설정 시 메모리 fixture 사용
- Contract repository: DB 설정 시 조회 수행, `monthly_rent_won` 정수와 API 원화 문자열 변환, 미설정 시 메모리 fixture 사용
- Payment repository: DB 설정 시 조회 수행, `amount_won` 정수와 API 원화 문자열 변환, 미설정 시 메모리 fixture 사용
- Maintenance·Inspection repository: DB 설정 시 조회 수행, 날짜와 nullable 완료일 매핑, 미설정 시 메모리 fixture 사용
- 로컬 PostgreSQL: `infra/docker-compose.yml` 제공. Docker가 없는 현재 환경에서는 컨테이너와 migration을 아직 실행하지 못함
- 감사 로그: `tenant.created` 이벤트의 actor/target/metadata를 transaction으로 기록하도록 구성. DB가 없는 환경에서는 영속 감사 기록을 생성하지 않음
- PostgreSQL CI: `.github/workflows/api-ci.yml`에서 DB 없는 품질 검사와 disposable PostgreSQL e2e를 분리

## 규칙

- 의미 있는 모든 변경을 문서에 기록합니다.
- 필요한 작업을 미루지 않습니다.
- 개별 부분을 수정하기 전에 전체 흐름을 이해합니다.
- 다음 단계로 넘어가기 전에 각 단계를 검증합니다.

## 다음 구현 단위

PostgreSQL migration과 seed를 실제 환경에 적용하고 나머지 도메인 repository를 데이터베이스 조회로 교체한 뒤 감사 기록과 보호된 쓰기 작업을 확장합니다.
