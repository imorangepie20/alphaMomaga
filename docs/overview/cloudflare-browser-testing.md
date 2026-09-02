# Cloudflare 브라우저 테스트 절차

## 기준

브라우저 테스트의 기본 주소는 로컬호스트가 아니라 Cloudflare Tunnel 주소입니다.

- 관리자 UI: https://mnre.approid.team/
- API: https://api.approid.team/

`http://localhost:3000`은 터널 테스트 주소가 아닙니다. 로컬 Next.js 개발 서버를 직접 확인할 때만 사용합니다.

## 터널 연결 구조

| 용도 | 공개 주소 | 로컬 origin |
|---|---|---|
| 관리자 UI | `https://mnre.approid.team/` | `http://localhost:3001` |
| API | `https://api.approid.team/` | `http://localhost:3100` |

Cloudflare 호스트명은 스테이징 접속 지점입니다. 두 origin 프로세스가 모두 실행 중이어야 하며, origin이 중지되면 `502 Bad Gateway`가 발생할 수 있습니다.

## 테스트 전 확인

1. API origin을 `api` 디렉터리에서 실행합니다.

```powershell
$env:Path = 'C:\Program Files\nodejs;' + $env:Path
cd C:\Users\jowoo\alpahMomega\api
npm.cmd run start:dev
```

2. 관리자 UI origin을 반드시 `3001` 포트로 실행합니다.

```powershell
$env:Path = 'C:\Program Files\nodejs;' + $env:Path
cd C:\Users\jowoo\alpahMomega\SDTPL_ADM
npm.cmd run dev -- -p 3001
```

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

## 완료 기준

- Cloudflare 관리자 UI가 정상 렌더링됩니다.
- Network 요청이 Cloudflare API 주소를 사용합니다.
- `/properties`가 `200`을 반환합니다.
- 콘솔에 hydration 오류가 없습니다.
- 테스트 종료 전 origin 프로세스를 임의로 중지하지 않습니다.
