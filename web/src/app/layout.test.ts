import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const rootLayout = readFileSync(resolve(__dirname, "layout.tsx"), "utf8");
const appHeader = readFileSync(
  resolve(__dirname, "../components/layout/app-header.tsx"),
  "utf8",
);
const shellAndAuthSources = [
  "(dashboard)/layout.tsx",
  "../components/layout/app-header.tsx",
  "../components/layout/app-sidebar.tsx",
  "../components/layout/breadcrumbs.tsx",
  "../components/layout/command-palette.tsx",
  "../components/layout/notifications.tsx",
  "(auth)/layout.tsx",
  "(auth)/login/page.tsx",
  "(auth)/register/page.tsx",
  "(auth)/forgot-password/page.tsx",
  "(auth)/reset-password/page.tsx",
  "(auth)/verify/page.tsx",
  "../components/auth/auth-card.tsx",
  "../components/auth/social-buttons.tsx",
].map((path) => readFileSync(resolve(__dirname, path), "utf8"));

describe("application theme", () => {
  it("keeps the management application light-only", () => {
    expect(rootLayout).not.toContain("ThemeProvider");
    expect(appHeader).not.toContain("ThemeToggle");
    expect(rootLayout).toContain('<html lang="ko" className="light"');
  });

  it("keeps dashboard and authentication sources free of inactive theme hooks", () => {
    for (const source of shellAndAuthSources) {
      expect(source).not.toContain("dark:");
      expect(source).not.toContain("ThemeToggle");
    }
  });

  it("uses semantic light surfaces for the dashboard and authentication entry points", () => {
    const dashboardLayout = shellAndAuthSources[0];
    const authLayout = shellAndAuthSources[6];
    const authCard = shellAndAuthSources[12];

    for (const source of [dashboardLayout, authLayout]) {
      expect(source).toContain("bg-background");
      expect(source).toContain("text-foreground");
    }

    for (const source of [appHeader, authCard]) {
      expect(source).toContain("border-border");
      expect(source).toContain("bg-card");
      expect(source).toContain("text-card-foreground");
    }
  });
});
