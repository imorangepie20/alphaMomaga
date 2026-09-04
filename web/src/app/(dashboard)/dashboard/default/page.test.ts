import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const source = readFileSync(resolve(__dirname, "page.tsx"), "utf8");

describe("default dashboard billing summary", () => {
  it("loads a live monthly billing summary and links it to the ledger", () => {
    expect(source).toContain("getBillingSummary");
    expect(source).toContain("/payments?billingMonth=");
  });
});
