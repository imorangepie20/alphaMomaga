import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const managerSource = readFileSync(resolve(__dirname, "tenant-manager.tsx"), "utf8");
const pageSource = readFileSync(resolve(__dirname, "page.tsx"), "utf8");

describe("tenant monthly billing view", () => {
  it("does not render a tenant-owned payment status control", () => {
    expect(managerSource).not.toContain('htmlFor="tenant-status"');
    expect(managerSource).toContain("billingMonth");
  });

  it("loads selected-month billing charges instead of tenant status aggregates", () => {
    expect(pageSource).toContain("getMonthlyCharges");
    expect(pageSource).not.toContain('tenant.status === "Paid"');
  });
});
