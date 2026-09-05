import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { expect, it } from "vitest";

it.each([
  "components/admin-account-pages.tsx",
  "components/admin-access-error.tsx",
  "components/operational-dashboard.tsx",
  "components/real-estate-overview.tsx",
  "components/layout/app-header.tsx",
  "components/layout/account-menu.tsx",
  "app/(auth)/login/page.tsx",
])("uses browser navigation rather than RSC Link for authentication: %s", (file) => {
  const source = readFileSync(resolve(process.cwd(), "src", file), "utf8");
  expect(source).not.toMatch(/<Link\b[^>]*\/auth\/(?:login|logout)/);
});
