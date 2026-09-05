# Cloudflare 브라우저 테스트 절차

## 기준

브라우저 테스트의 기본 주소는 로컬호스트가 아니라 Cloudflare Tunnel 주소입니다.

- 관리자 UI: https://mnre.approid.team/
- API: https://api.approid.team/

`http://localhost:3000`은 사용하지 않습니다. 로컬 관리자 앱은 `http://localhost:3001`에서 확인합니다.

## 터널 연결 구조

| 용도 | 공개 주소 | 로컬 origin |
|---|---|---|
| 관리자 UI | `https://mnre.approid.team/` | `http://localhost:3001` (`web/`) |
| API | `https://api.approid.team/` | `http://localhost:3100` |

Cloudflare 호스트명은 스테이징 접속 지점입니다. 두 origin 프로세스가 모두 실행 중이어야 하며, origin이 중지되면 `502 Bad Gateway`가 발생할 수 있습니다.

## 테스트 전 확인

1. API origin을 `api` 디렉터리에서 실행합니다.

```powershell
$env:Path = 'C:\Program Files\nodejs;' + $env:Path
cd C:\Users\jowoo\alpahMomega\api
$env:PORT = '3100'
npm.cmd run start:dev
```

API는 시작 시 `api/.env`를 읽습니다. Auth0 값을 변경한 뒤에는 API 프로세스를 다시 시작합니다.

`api/src/main.ts`의 기본 포트는 Cloudflare API tunnel origin과 같은 `3100`입니다. 배포 환경에서 `PORT`를 명시하면 그 값이 우선하며, Cloudflare 개발 환경에서는 별도 포트 설정 없이 tunnel 계약을 유지합니다.

2. 관리자 UI origin을 반드시 `3001` 포트로 실행합니다.

```powershell
$env:Path = 'C:\Program Files\nodejs;' + $env:Path
cd C:\Users\jowoo\alpahMomega\web
npm.cmd run dev -- -p 3001
```

`web/.env.local` 또는 origin 프로세스 환경 변수에 `API_URL=https://api.approid.team`을 설정합니다. 운영 원장 조회는 실제 API와 서버 세션 토큰을 사용하며, 설정 누락·조회 실패를 예시 데이터로 대체해서 검수하지 않습니다.

`web/next.config.ts`의 `allowedDevOrigins`에는 `mnre.approid.team`이 포함되어야 합니다. 이 값은 Cloudflare Tunnel을 경유한 Next 개발 리소스와 HMR 요청을 허용합니다. 변경한 뒤에는 `web` 개발 서버를 재시작합니다.

3. 공개 주소 응답을 확인합니다.

```powershell
Invoke-WebRequest https://mnre.approid.team/ -UseBasicParsing
Invoke-WebRequest https://api.approid.team/health/database -UseBasicParsing
```

웹 요청은 로그인 페이지로 이동할 수 있습니다. DB 상태 확인은 `200` 및 정상 상태를
확인합니다. `/properties` 등 업무 API는 비로그인 요청에 `401`을 반환하는 것이 정상이며,
준비 확인을 위해 인증을 제거하지 않습니다.

## 브라우저 테스트 순서

1. [https://mnre.approid.team/](https://mnre.approid.team/)을 엽니다.
2. 대시보드, 매물, 임차인, 계약, 수납, 유지보수, 점검 화면을 확인합니다.
3. 서버 렌더링 조회는 웹 서버에서 API로 전달됩니다. 브라우저 Network에서 직접 보이지 않을 수 있습니다.
   변경 요청은 동일 웹 origin의 `/api/...`를 거쳐 API로 전달되므로 해당 응답 상태를 확인합니다.
4. API 요청이 `localhost:3000` 또는 잘못된 로컬 포트로 나가면 프론트엔드 환경 설정을 먼저 확인합니다.
5. 쓰기 작업은 인증 토큰과 권한이 준비된 환경에서만 실행합니다.

## Playwright로 Cloudflare 테스트

VS Code 터미널에서도 기존 Playwright를 실행할 수 있다. 별도 브라우저 제어 도구의
연결 상태와 Playwright 실행 가능 여부는 서로 다른 조건이다.
브라우저 창을 보려면 기존 테스트 명령에 `--headed`를 추가한다.
테스트 중 자동으로 이동·종료되는 창은 수동 로그인용 창이 아니므로 조작하지 않는다.
일반 Chrome 로그인도 Playwright의 새 테스트 context에 자동 공유되지 않는다.

2026-09-05 Cloudflare headed 검사: 10개 중 9개 통과, 역할 경로가 Auth0 로그인으로
이동하여 1개 실패했다. 원인은 확정하지 않았으며 동일 경로의 headless 재검사는 통과했다.
이 결과는 Playwright 브라우저 실행과 비로그인 접근 검사이며 인증 후 업무 검수를 대신하지 않는다.

`web/`의 Playwright 설정에서 `PLAYWRIGHT_BASE_URL`을 지정하면 로컬 Next.js 서버를 별도로 시작하지 않고 Cloudflare 관리자 UI를 직접 테스트합니다. Tunnel origin이 `web`의 3001 포트를 가리키도록 전환된 뒤 사용합니다.

```powershell
$env:PLAYWRIGHT_BASE_URL = 'https://mnre.approid.team'
cd C:\Users\jowoo\alpahMomega\web
npm.cmd run test:e2e -- e2e/auth-session.spec.ts
```

### 실제 로그인 세션 준비

자동 검사와 별도로 아래 명령을 `web/`에서 실행하면 수동 로그인용 창이 열린다.

```powershell
.\node_modules\.bin\playwright.cmd open --browser chromium --save-storage=auth0-storage-state.json https://mnre.approid.team/login
```

테스트 계정으로 직접 로그인하고 대시보드를 확인한 뒤 창을 닫는다. 종료 시 생성되는
`web/auth0-storage-state.json`은 Git 제외 대상이다. 파일에는 로그인 자격 증명이
포함될 수 있으므로 내용을 출력하거나 채팅·저장소·테스트 보고서에 첨부하지 않는다.
기존 파일이 있으면 이전 검수에 필요한지 확인하고 새 로그인을 진행한다.

```powershell
$env:PLAYWRIGHT_BASE_URL = 'https://mnre.approid.team'
$env:PLAYWRIGHT_AUTH_STORAGE_STATE = 'auth0-storage-state.json'
npm.cmd run test:e2e -- e2e/properties-dashboard.spec.ts e2e/billing-ledger.spec.ts --workers=1
```

위 두 검사는 조회 전용이다. API 직접 대조 검사는 별도로 유효한 테스트 계정의
`PLAYWRIGHT_API_TOKEN`이 필요하다. 수납 변경 검사는 `monthly-billing-operations.md`의
전용 데이터 조건을 충족한 뒤에만 실행한다. 세션 만료 시 다시 로그인하며 인증을 우회하지 않는다.

## 라이트 전용 UI 수동 검증

자동 검증에서는 `web/src`의 `dark:` 변형과 `.dark` selector가 제거되었고, 회귀 테스트와 production build가 통과했습니다. 다만 이 문서 작성 시점에는 제어 가능한 Cloudflare Tunnel 브라우저 세션이 없어 다음 검사는 아직 수동으로 완료하지 못했습니다.

1. `https://mnre.approid.team/`에서 checkbox, radio, switch, tabs, badge, 메뉴의 hover, focus-visible, disabled, invalid 상태를 확인합니다.
2. `/properties`, `/tenants`, `/contracts`에서 native select와 날짜 입력의 라이트 표면을 확인하고, 권한이 있는 계정으로 등록 및 수정을 수행합니다.
3. `/payments`, `/maintenance`, `/inspections`, `/settings`, `/admin/users`에서 배경, 카드, 입력 필드, 표의 대비를 확인합니다.
4. Auth0 로그인과 로그아웃 후 차트 tooltip 및 legend를 포함한 공통 UI가 라이트 상태로 유지되는지 확인합니다.

검사 중 HMR 이전 스타일이 보이면 `web` 개발 서버를 재시작하고 브라우저를 강력 새로고침한 뒤 동일 항목을 다시 확인합니다. 이 절차는 다크 테마를 다시 활성화하기 위한 것이 아니라, 이전 개발 번들이 남아 있는 상태를 배제하기 위한 것입니다.

로컬 테스트로 되돌릴 때는 환경 변수를 제거합니다.

```powershell
Remove-Item Env:PLAYWRIGHT_BASE_URL -ErrorAction SilentlyContinue
```

## 오류 대응

### `502 Bad Gateway`

1. API가 `3100` 포트에서 실행 중인지 확인합니다.
2. 관리자 UI가 `3001` 포트에서 실행 중인지 확인합니다.
3. Cloudflare Tunnel route가 위 두 포트를 가리키는지 확인합니다.
4. origin을 재시작한 뒤 공개 주소를 다시 호출합니다.

### `localhost:3000`으로 접속한 경우

터널 브라우저 테스트가 아닙니다. 주소를 [https://mnre.approid.team/](https://mnre.approid.team/)로 바꿉니다.

### API 응답이 실패하는 경우

```powershell
Invoke-WebRequest https://api.approid.team/properties -UseBasicParsing
```

- `200`: API와 터널 정상
- `401` 또는 `403`: 인증/권한 문제
- `502`: API origin 또는 터널 route 문제
- 연결 시간 초과: origin 프로세스, 네트워크, 터널 상태 확인

### 버튼 클릭 또는 HMR이 동작하지 않는 경우

Next 개발 로그에 `Blocked cross-origin request to Next.js dev resource`가 있으면 공개 도메인이 개발 서버에 허용되지 않은 상태입니다. `web/next.config.ts`의 `allowedDevOrigins`에 `mnre.approid.team`을 추가하고 `web` 개발 서버를 재시작한 뒤 브라우저를 새로고침합니다.

## 완료 기준

- Cloudflare 관리자 UI가 정상 렌더링됩니다.
- Network 요청이 Cloudflare API 주소를 사용합니다.
- `/properties`가 `200`을 반환합니다.
- 콘솔에 hydration 오류가 없습니다.
- 테스트 종료 전 origin 프로세스를 임의로 중지하지 않습니다.
