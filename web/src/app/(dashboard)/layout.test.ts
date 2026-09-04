import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const dashboardLayout = readFileSync(resolve(__dirname, "layout.tsx"), "utf8");

describe("dashboard shell", () => {
  it("renders the shared application footer below page content", () => {
    expect(dashboardLayout).toContain('import { AppFooter } from "@/components/layout/app-footer"');
    expect(dashboardLayout).toContain("<AppFooter />");
  });
});
