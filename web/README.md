# Alpha Momega Web — 부동산 관리 관리자

`SDTPL_ADM` 테마를 참고해 구성한 실제 부동산 관리 관리자 애플리케이션입니다.
**Next.js 16 + React 19 + Tailwind v4 + shadcn/ui (Base UI)**를 사용합니다.

## Dev

```bash
npm run dev       # run dev server
npm run build     # production build
npm run lint      # lint
npm run test:e2e  # Playwright browser tests
```

## Structure

- `src/lib/nav.ts` — sitemap driving the sidebar + ⌘K command palette
- `src/lib/*.ts` — API data access and typed domain models
- `src/app/(dashboard)` — app-shell routes (sidebar + header)
- `src/app/(auth)` — auth routes (bare centered layout)
- `src/components/layout/` — sidebar, header, command palette, notifications, theme
- `src/components/ui/` — shadcn/ui primitives (Base UI)

## Status

The API is provided by the sibling `api/` NestJS application. Configure `API_URL` or
`NEXT_PUBLIC_API_URL` for a deployed environment. The original theme reference remains in
the sibling `SDTPL_ADM/` directory and is not an application source directory.

`API_URL` is preferred for server-side data fetching. Copy `.env.example` to `.env.local`
for local development and set the API origin to `http://localhost:3100` when the local API
is running.
