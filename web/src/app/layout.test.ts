import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const rootLayout = readFileSync(resolve(__dirname, "layout.tsx"), "utf8");
const appHeader = readFileSync(
  resolve(__dirname, "../components/layout/app-header.tsx"),
  "utf8",
);

describe("application theme", () => {
  it("keeps the management application light-only", () => {
    expect(rootLayout).not.toContain("ThemeProvider");
    expect(appHeader).not.toContain("ThemeToggle");
  });
});
