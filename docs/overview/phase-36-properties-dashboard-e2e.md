# Phase 36: Properties 핵심 화면 브라우저 검증

## 목표
실제 애플리케이션 프론트엔드인 `web/`의 Properties 업무 화면을 3001 포트 기준으로 검증합니다.

## 검증 범위

- `/properties` 라우트 로드
- 매물 페이지 제목과 목록 표시
- 전체 자산, 평균 점유율, 검토 필요 요약 표시
- 대표 매물명과 점유율 표시
- Playwright 서버의 API origin 기본값 `http://localhost:3100` 확인

## 실행

```powershell
cd C:\Users\jowoo\alpahMomega\web
npm.cmd run lint
npm.cmd run build
.\node_modules\.bin\playwright.cmd test e2e/properties-dashboard.spec.ts --workers=1
```

## 결과

- Properties 브라우저 테스트: **1개 통과**
- web lint: 기존 warning만 출력
- web 타입 진단: 오류 없음
- 관리자 로컬 기준: `http://localhost:3001`
- 테마 원본 `SDTPL_ADM/`은 변경하지 않음
