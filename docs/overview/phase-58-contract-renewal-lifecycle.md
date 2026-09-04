# Phase 58: 계약 갱신 lifecycle

## 변경 이유

기존 계약 화면에서는 새 계약을 수동으로 등록해야 했고, 종료일 이전에 갱신 계약을
예약할 때 원본 계약과 같은 호실의 기간 중복을 방지하는 전용 흐름이 없었습니다.
또한 날짜가 지나도 `Upcoming`과 `Active` 상태가 자동으로 정합화되지 않았습니다.

## 변경 내용

- `POST /contracts/:id/renew`를 추가했습니다. 원본 계약의 속성, 임차인, 호실을
  재사용하고 새 시작일, 종료일, 월 임대료만 받습니다.
- 새 시작일은 원본 종료일의 UTC 다음 날과 같아야 하며, 과거 시작일과 기간 중복은
  거부합니다. 미래 시작 계약은 `Upcoming`, 시작일 당일 계약은 `Active`로 생성합니다.
- 계약 조회와 갱신 전에는 `Upcoming -> Active -> Expired` 상태를 UTC 날짜 기준으로
  정합화합니다. `Terminated`와 `Expired`는 자동 변경하지 않습니다.
- 동일 속성·호실의 생성 및 갱신은 PostgreSQL advisory transaction lock으로 직렬화한
  뒤 기간 중복을 검사합니다. 해지 계약은 `terminatedAt`을 실제 점유 종료일로 사용합니다.
- 갱신은 새 계약만 만들고 원본 계약을 삭제하거나 수정하지 않습니다. 따라서 기존
  `Payment.contractId`와 수납 이력은 유지됩니다. 성공한 갱신에는 `contract.renewed`
  감사 로그가 남습니다.
- 웹 `/contracts`는 `Active`, `Expired` 계약에 `갱신` 동작을 제공합니다. 임차인,
  속성, 호실, 새 시작일은 읽기 전용이며 관리자는 새 종료일과 월 임대료만 입력합니다.
  요청은 인증 BFF `POST /api/proxy/contracts/:id/renew`를 사용합니다.

## 권한 및 오류

API 갱신 endpoint와 BFF는 `contract:manage` 권한을 사용합니다. BFF는 계약 ID 뒤의
리터럴 `renew` action만 `POST`로 전달하며 임의의 중첩 API 경로를 허용하지 않습니다.
화면은 `400`을 날짜·계약 조건 오류로, `401`을 로그인 만료로, `403`을 권한 부족으로
안내합니다.

## 검증

- API 계약 서비스: lifecycle, 갱신, 기간 중복, 해지일, advisory lock 범위를 포함한
  focused 테스트
- API 계약 컨트롤러: 갱신 principal 전달과 오류 변환
- 웹: BFF action 경계와 갱신 요청 원화 직렬화
- API 전체 테스트 및 빌드, 웹 TypeScript 검사, Auth0 비인증 redirect Playwright 테스트

## 브라우저 확인

`contract:manage` 권한이 있는 계정으로 `https://mnre.approid.team/contracts`에 로그인한 후,
유효 또는 만료 계약에서 `갱신`을 선택합니다. 표시된 다음 시작일은 수정하지 않고 새
종료일과 월 임대료를 입력해 저장합니다. 목록에 원본 계약과 새 `Upcoming` 계약이 함께
보이는지, 그리고 기존 수납 레코드가 원본 계약 ID를 유지하는지 확인합니다.
