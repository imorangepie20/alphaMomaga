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

`web/.env.local` 또는 origin 프로세스 환경 변수에 `API_URL=https://api.approid.team`을 설정합니다. 설정하지 않으면 서버 페이지가 로컬 fallback fixture를 사용할 수 있습니다.

`web/next.config.ts`의 `allowedDevOrigins`에는 `mnre.approid.team`이 포함되어야 합니다. 이 값은 Cloudflare Tunnel을 경유한 Next 개발 리소스와 HMR 요청을 허용합니다. 변경한 뒤에는 `web` 개발 서버를 재시작합니다.

3. 공개 주소 응답을 확인합니다.

```powershell
Invoke-WebRequest https://mnre.approid.team/ -UseBasicParsing
Invoke-WebRequest https://api.approid.team/properties -UseBasicParsing
```

두 요청 모두 `200`이어야 합니다.

## 브라우저 테스트 순서

1. [https://mnre.approid.team/](https://mnre.approid.team/)을 엽니다.
2. 대시보드, 매물, 임차인, 계약, 수납, 유지보수, 점검 화면을 확인합니다.
3. 브라우저 개발자 도구 Network 탭에서 API 요청이 `api.approid.team`으로 나가는지 확인합니다.
4. API 요청이 `localhost:3000` 또는 잘못된 로컬 포트로 나가면 프론트엔드 환경 설정을 먼저 확인합니다.
5. 쓰기 작업은 인증 토큰과 권한이 준비된 환경에서만 실행합니다.

## Playwright로 Cloudflare 테스트

`web/`의 Playwright 설정에서 `PLAYWRIGHT_BASE_URL`을 지정하면 로컬 Next.js 서버를 별도로 시작하지 않고 Cloudflare 관리자 UI를 직접 테스트합니다. Tunnel origin이 `web`의 3001 포트를 가리키도록 전환된 뒤 사용합니다.

```powershell
$env:PLAYWRIGHT_BASE_URL = 'https://mnre.approid.team'
cd C:\Users\jowoo\alpahMomega\web
npm.cmd run test:e2e -- e2e/dashboards-ops.spec.ts
```

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
