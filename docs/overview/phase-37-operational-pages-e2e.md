# Phase 37: 운영 페이지 브라우저 회귀 검증

## 목표
실제 프론트엔드 `web/`의 주요 운영 페이지가 정상 렌더링되는지 확인합니다.

## 검증 범위

- `/tenants`: 임차인 목록과 임차료
- `/contracts`: 계약 목록과 종료일
- `/payments`: 수납 목록과 금액
- `/maintenance`: 유지보수 작업과 예정일
- `/inspections`: 점검 유형과 예정일

각 페이지에서 한국어 제목과 대표 fixture/API 필드를 확인합니다. `SDTPL_ADM/`은 테스트 대상이 아닙니다.

## 실행

```powershell
cd C:\Users\jowoo\alpahMomega\web
.\node_modules\.bin\playwright.cmd test e2e/operational-pages.spec.ts --workers=1
```

## 결과

- 운영 페이지 브라우저 테스트: **5개 통과**
- 관리자 포트: `3001`
- API origin 기본값: `http://localhost:3100`
