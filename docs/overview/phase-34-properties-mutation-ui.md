# Phase 34: Properties 생성·수정 UI

## 목표
관리자 Properties 화면에서 실제 API를 사용해 매물을 생성하고 수정할 수 있도록 합니다.

## 변경 사항

- `SDTPL_ADM/src/components/properties/property-mutations.tsx` 추가
- Properties 페이지에 생성 폼과 행별 수정 버튼 추가
- 이름, 위치, 유형, 점유율, 상태 입력 지원
- 생성은 `POST /properties`, 수정은 `PUT /properties/:id` 사용
- 저장 성공 후 화면의 목록을 즉시 갱신
- 입력값 검증 및 API 오류 메시지 표시
- `NEXT_PUBLIC_API_URL`을 우선 사용하고 `API_URL`, staging API 주소 순으로 fallback

## 인증

API mutation은 서버 권한 검사를 통과해야 하므로 브라우저 `localStorage`의 `property-manager-token` 값을 Bearer 토큰으로 전송합니다.

```javascript
localStorage.setItem('property-manager-token', '<JWT_TOKEN>')
```

토큰이 없으면 API를 호출하지 않고 화면에 인증 토큰 오류를 표시합니다. 데모 역할 헤더를 프론트에 추가하지 않았기 때문에 staging에서도 인증 우회가 발생하지 않습니다.

## 검증

- Next.js build: 성공
- 기존 Cloudflare Properties API 브라우저 테스트: 통과
- 수정된 컴포넌트와 페이지 타입 진단: 오류 없음
