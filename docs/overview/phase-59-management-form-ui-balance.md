# Phase 59: 관리 폼 UI 균형 개선

## 변경 이유

속성, 임차인, 계약 관리 폼은 입력 높이와 여백 규칙이 서로 달랐고, 다크 모드에서
원시 HTML `select`의 선택 목록이 브라우저의 밝은 표면에 밝은 글자를 표시해 읽기
어려웠습니다. 또한 다이얼로그 제목, 라벨, 버튼이 모두 강한 굵기를 사용해 정보
계층이 충분히 구분되지 않았습니다.

## 변경 내용

- `web/src/app/globals.css`에 `select option`의 `Canvas`/`CanvasText` 시스템 색상 규칙을
  추가하고, 라이트/다크 토큰에 `color-scheme`을 선언해 운영체제 선택 목록, 날짜 입력,
  스크롤바의 배경과 글자색 대비를 앱 테마와 일치시켰습니다.
- `Label`, `Input`, `NativeSelect`, `Dialog` 공통 컴포넌트의 글자 굵기, 높이, 간격을
  조정했습니다.
  - 필드 라벨은 `font-normal`로 낮춰 입력값 및 제목과 경쟁하지 않도록 했습니다.
  - 입력과 공용 선택 필드는 `h-9`, `bg-input/30`으로 통일했습니다.
  - 다이얼로그는 `p-5`, `gap-5`와 더 가벼운 하단 작업 영역을 사용합니다.
- `properties`, `tenants`, `contracts`의 원시 `select`에도 같은 입력 표면과 높이 규칙을
  적용했습니다.

## 검증

- `npm.cmd --prefix web run test -- src/app/globals.test.ts next.config.test.ts`
  - 2개 테스트 통과
- `npm.cmd --prefix web run lint -- ...`
  - 공통 UI와 세 관리 폼 대상 ESLint 통과

실제 브라우저에서는 라이트 및 다크 모드에서 임차인 선택 목록, 날짜 입력, 저장 버튼의
대비와 간격을 확인해야 합니다.
