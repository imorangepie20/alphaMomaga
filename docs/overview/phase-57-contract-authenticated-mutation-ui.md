# Phase 57: 인증된 계약 관리 화면

## 변경 이유

`/contracts` 화면은 계약 조회와 만료 통계만 제공하여 관리자가 새 계약을 등록하거나
계약 상태를 변경할 수 없었습니다. 또한 API의 계약 수정은 변경된 계약의 날짜와 상태
관계를 다시 검증하지 않아, 유효 기간 중인 계약을 `Expired` 상태로 바꿀 수 있었습니다.

## 변경 내용

- `web/src/app/(dashboard)/contracts/contract-manager.tsx`를 추가했습니다.
  - 계약 등록 시 임차인을 선택하면 해당 임차인의 `propertyId`, 호실, 현재 임대료를 자동 반영합니다.
  - 계약 상태, 시작일, 종료일, 월 임대료를 입력해 인증된 BFF `POST /api/proxy/contracts`로 저장합니다.
  - 기존 계약은 상태와 해지일만 수정할 수 있으며, 해지 상태에는 해지일을 필수로 요구합니다.
  - `401`, `403`, `400` 응답을 로그인, 권한, 계약 lifecycle 오류로 구분해 안내합니다.
- `web/src/lib/contract-mutation.ts`에서 원화 숫자를 API가 요구하는 `₩1,200,000` 형식으로 변환하고,
  `POST /api/proxy/contracts`, `PUT /api/proxy/contracts/:id` 요청을 전송합니다.
- 계약 목록은 속성, 호실, 기간, 해지일을 함께 표시하고 실제 현재 날짜를 기준으로 갱신 검토와
  만료 임박 통계를 계산합니다.
- `api/src/contracts/contracts.service.ts`는 계약 수정 후 병합된 계약을 `validateContract()`로 검증합니다.
  DB 경로는 트랜잭션 안에서 검증 실패 시 롤백되며, 메모리 경로는 검증 성공 후에만 값을 반영합니다.

## 업무 흐름 및 권한

계약은 `property -> tenant -> contract -> payment -> maintenance` 흐름의 세 번째 단계입니다.
따라서 계약 생성 화면은 임차인에 이미 연결된 속성과 호실을 변경하지 않습니다. 서버는
`contract:manage` 권한이 있는 세션의 Access Token만 BFF에서 API로 전달하며, API는 계약의
시작일, 종료일, 상태, 해지일이 lifecycle 규칙과 일치하는지 최종 검증합니다.

## 검증

- `npm.cmd --prefix web run test -- src/lib/contract-mutation.test.ts`
  - 2개 테스트 통과: 보호된 생성/수정 BFF 경로와 원화 형식 직렬화
- `npm.cmd --prefix api run test -- contracts.service.spec.ts`
  - 12개 테스트 통과: 유효한 해지와 유효 기간 중 만료 전환 거부를 포함한 lifecycle 검증

브라우저의 실제 저장 동작은 Auth0 로그인 세션과 `contract:manage` 권한이 있는 계정으로
`https://mnre.approid.team/contracts`에서 별도로 확인해야 합니다.
