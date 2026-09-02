# 15단계: 감사 로그

## 목표

보호된 임차인 생성 작업의 수행 주체와 대상, 입력 요약을 추적할 수 있는 감사 기록 경계를 마련합니다.

## 구현 내용

- `audit_logs` 테이블과 entity/actor 조회용 index를 추가했습니다.
- 수행 주체, 역할, 작업명, 대상 엔터티, 대상 ID, metadata, 생성 시각을 기록합니다.
- DB가 설정된 경우 임차인 생성과 `tenant.created` 감사 기록을 하나의 transaction으로 처리합니다.
- 인증된 JWT subject와 role을 감사 기록의 주체 정보로 전달합니다.
- DB가 없는 메모리 fallback에서는 내구성 없는 감사 기록을 만들지 않습니다.
- 감사 기록은 대상 엔터티의 삭제에 의존하지 않도록 외래키를 두지 않습니다.

## 현재 범위

현재 감사 이벤트는 보호된 임차인 생성에만 적용됩니다. 데이터베이스가 실제로 준비되면 transaction rollback과 감사 기록 보존을 통합 테스트해야 합니다. 감사 조회 endpoint, 보관 기간 정책, 모든 변경 작업에 대한 이벤트 확장은 후속 작업입니다.

## 검증

- 감사 서비스 단위 테스트: 통과
- API 단위 테스트: `40 passed`
- API end-to-end 테스트: `12 passed`
- API build: 통과
- 감사 테이블 migration 생성: `audit_logs` 8개 컬럼, index 2개 확인

다음 단계: PostgreSQL migration/seed를 실제 실행하고 임차인 생성 transaction의 commit 및 rollback을 통합 검증합니다.