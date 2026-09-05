# 현재 개발 인계

## 현재 목표

Alpha Momega를 자산, 임차인, 계약, 월별 청구, 실제 수납, 미수, 정비, 점검을 하나의 업무 흐름으로 관리하는 운영 시스템으로 완성한다.

기준 업무 흐름은 다음과 같다.

~~~text
property -> tenant -> contract -> monthly charge -> payment -> maintenance -> inspection
~~~

## 2026-09-04 모듈 경계 복구

- 원인: `BillingModule`에 컨트롤러를 추가한 뒤 `AuthGuard`와 `PermissionsGuard`가 모듈 내부에서 `RolesService`를 해석하지 못해 Nest 애플리케이션이 시작되지 않았다. `ContractsModule`도 `InMemoryReferenceRegistry`를 공유하지 않아 DB 미구성 환경의 동적 계약 참조가 분리될 위험이 있었다.
- 변경: `RolesModule`, `AuthModule`, `DomainModule`을 추가해 역할, 인증 가드, 인메모리 참조 저장소를 명시적으로 export했다. `BillingModule`은 인증과 역할 모듈을 import하고 가드를 해당 컨트롤러 경계에 제공하며, `ContractsModule`은 전역 `DomainModule`을 import한다.
- 검증: `npm.cmd run test:e2e --prefix api -- lifecycle-simulation.e2e-spec.ts`와 `npm.cmd run build --prefix api`를 통과했다. 속성 생성부터 임차인, 계약, 결제, 유지보수, 점검 삭제까지의 기존 흐름이 다시 동작한다.

## 승인된 다음 작업

### 2026-09-05 현재 상태

- 후속 격리 PostgreSQL 검수 통과: 빈 DB migration, 동시 청구 유일성,
  동시 수납 과배분 차단, API 재생성 후 영속성 및 동시 void 잔액 복구.
  PostgreSQL 테스트는 전용 `TEST_DATABASE_URL`로만 실행한다.
  API 린트는 Oxlint이며 실행 성공(기존 경고 4개). 상세는 운영 준비 검수 문서 참고.

- 운영 준비 검수를 시작했다. DB 첫 상태 확인의 거짓 정상 응답을 수정하고
  수납 통합 테스트에 금액 변화·void 복구·중복 생성 방지 검증을 추가했다.
  API 207개, 인메모리 통합 21개 및 Cloudflare 비로그인 테스트 통과.
  PostgreSQL 전용 테스트는 미실행이며 전체 완료가 아니다.
  다음 검수 항목과 근거는 `docs/overview/release-readiness.md`를 따른다.

- 공통 헤더의 중복 사용자 이름·큰 검색 영역을 정리하고 계정 드롭다운을 적용했다.
  실제 기능이 없는 알림 버튼은 사용자 요청에 따라 제거했다. `docs/overview/global-header.md` 참고.

- 사용자 관리 확인창을 기존 테마 `AlertDialog`로 통일했다. 브라우저 기본 confirm 대신
  테마 확인·취소·처리 중 잠금을 사용한다. 웹 140개 테스트 통과. 이후 확인창도 테마를 사용한다.

- 사용자 초대·역할 변경의 버튼 무반응을 수정했다. 공통 버튼에 submit 타입이 누락돼
  클릭 시 요청이 발생하지 않았다. 실제 클릭 회귀 검증을 추가했으며 웹 139개 테스트 통과.
  `docs/overview/auth0-management-api.md` 참고. 실제 계정 변경은 미실행이다.

- `/auth/login` RSC fetch 오류를 수정했다. 로그인·로그아웃 링크 6곳을 Next `Link`에서
  일반 `<a>`로 변경했다. 웹 134개 테스트 및 린트 통과. `docs/architecture/web-auth-boundary.md` 참고.

- Auth0 Management API 연결 및 사용자 조회·초대 링크·차단·운영 역할 변경을 구현했다.
  실제 토큰/사용자/역할 조회 200 확인. 웹 128개·API 205개 테스트 및 양쪽 빌드 통과.
  `docs/overview/auth0-management-api.md` 참고. 실제 계정 변경과 초대 링크 사용은 미검증.
  관리자 승격·본인 및 기존 Admin 변경은 콘솔 전용이며 외부 이메일 자동 발송은 없다.

- 관리자 사용자·역할·보고서·설정의 예시 내용을 제거하고 실제 계정·정책 조회,
  월별 수납 보고서·CSV 및 적용 설정 확인으로 전환했다. 웹 테스트 121개 통과.
  `docs/overview/admin-workspace.md` 참고. 계정 관리 API는 위 후속 작업으로 연결했다.
  시스템 설정 영속 수정은 아직 미구현이며 현재 적용값만 표시한다.

- 메인 부동산 대시보드도 실제 기록으로 전환했다. 자산별 청구·수납·미수 및 입력 점유율
  그래프, 우선 처리 정비·점검, 만료 임박 계약을 제공한다. 웹 테스트 110개 통과.
  수납 권한 오류는 별도로 표시한다. 상세는 `docs/overview/operational-dashboards.md` 참고.

- 자산 현황·점유율·수익 현황의 고정 예시 수치를 실제 자산·계약·월별 청구 집계로 교체했다.
  `docs/overview/operational-dashboards.md` 참고. 웹 테스트 103개, 변경 파일 린트 및 빌드 통과.
  호실 총수·입퇴실 이력·비용 원장이 없어 공실 수·가중 점유율·순이익은 산출하지 않는다.
  인증된 브라우저 시각 검증은 남아 있다.

- 계약 화면의 기간 집계, 검색·자산/상태/만료 필터와 남은 일수 표시를 개선했다.
  `docs/overview/contract-workspace.md` 참고. 웹 테스트 94개 및 변경 파일 린트 통과.

- 임차인 화면의 다중 청구 누락을 수정하고 월 선택·검색·자산/상태 필터·개별 청구 내역을 추가했다.
  `docs/overview/tenant-ledger-workspace.md` 참고. 집계는 확정 청구와 임차인 인원수 기준이다.

- 점검 화면에 등록·일정/긴급도 수정·검토·완료일 입력과 필터를 연결했다.
  `docs/overview/inspection-workflow-ui.md` 참고. API도 일정·긴급도 수정을 지원하며 완료일은 서울 기준으로 검증한다.
- 최신 검증: 웹 75개, API 184개 테스트 및 양쪽 빌드 통과. 인증된 브라우저 수동 검증은 남아 있다.

- 유지보수 화면에 등록, 일정·상태 수정, 작업 시작, 완료 확인, 검색·자산·상태 필터 및 기한 초과
  표시를 연결했다. `docs/overview/maintenance-workflow-ui.md`에 구현 범위와 후속 기능을 기록했다.
- 유지보수 조회 실패 시 예시 데이터가 표시되지 않는다. 웹 테스트 69개, 타입 검사, 변경 파일 린트 통과.
- 반복 보일러 작업은 통합 테스트 데이터와 일치하지만 생성 주체는 확정하지 않았다. 기존 레코드는 유지했다.

- 월별 수납 구현 이후 자산 운영 현황을 확장했다. 상세 변경은
  `docs/overview/phase-63-property-operations-overview.md`를 참고한다.
- 자산 화면의 금액 집계는 해당 월 확정 청구 기준이며 초안·취소는 제외한다. 초안은 승인 대기 건수로 표시한다.
- 실제 계약 기간을 확인하며, 자산 화면의 API 실패 시 예시 데이터로 대체하지 않는다.
- 웹 전체 테스트 60개 통과. 다음 우선순위는 다른 운영 화면의 예시 데이터 대체 동작 점검과
  자산별 상세 업무로 연결되는 탐색 기능이다. 아래 수납 설계는 기존 구현의 기준 문서로 유지한다.

월별 청구 및 수납 원장을 구현한다. 승인된 설계와 실행 계획은 다음 문서가 기준이다.

- 설계: `docs/superpowers/specs/2026-09-04-monthly-billing-ledger-design.md`
- 실행 계획: `docs/superpowers/plans/2026-09-04-monthly-billing-ledger.md`

구현은 계약 청구 규칙과 데이터베이스 구조, 청구 초안 생성, 수납·배분·void, 인증 API와 스케줄러, 운영 화면, 임차인·대시보드 연동, Cloudflare 검증 순서로 진행한다.

## 작업 방식

- 사용자는 시간보다 운영 완성도를 우선한다. 현재 기능의 증상만 가리는 수정 대신 실제 업무 흐름과 데이터 근거를 먼저 완성한다.
- 선택지를 반복해서 요청하지 않는다. 실무상 가장 안전하고 되돌릴 수 있는 기본안을 추천하고 실행한다. 비용, 법적 책임, 데이터 파괴처럼 되돌리기 어려운 영향이 있을 때만 명확히 알린다.
- 중단 요청이 없으면 테스트, 문서화, 커밋, 원격 `main` push까지 이어서 수행한다.
- 기능 구현은 테스트 우선으로 진행한다. 의미 있는 변경은 원인, 변경 내용, 검증 결과를 한국어 문서에 남긴다.
- 기존 `payments`와 `tenants.status`는 전환 기간 동안 삭제하거나 새 원장으로 자동 변환하지 않는다. 새 운영 화면은 월별 청구 원장을 기준으로 한다.

## 시작 절차

다음 세션의 작업자는 먼저 `AGENTS.md`, `docs/project-rules/core-principles.md`, `docs/project-rules/doc-access-order.md`, 이 문서, 승인 설계, 실행 계획을 읽는다. 그 후 실행 계획의 아직 완료되지 않은 첫 작업부터 진행한다.

## 완료 기준

- 월별 청구가 활성 계약에서 중복 없이 자동 생성되고 관리자가 확정할 수 있다.
- 실제 수납과 배분으로 청구·수납·미수·연체가 계산된다.
- 취소와 void는 감사 이력을 보존하고 잔액을 정확히 복구한다.
- 임차인, 대시보드, 수납 화면은 특정 기준월과 실제 금액을 명시한다.
- Auth0 권한, API·PostgreSQL·웹 테스트, Cloudflare 브라우저 흐름을 검증한다.
