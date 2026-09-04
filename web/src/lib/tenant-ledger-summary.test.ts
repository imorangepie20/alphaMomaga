import { expect, it } from "vitest";
import { summarizeTenantCharges } from "./tenant-ledger-summary";
import type { MonthlyCharge } from "./billing";
const charge: MonthlyCharge = { id: "c", propertyId: "p", tenantId: "t", contractId: "k", billingMonth: "2026-09", dueDate: "2026-09-01", baseRentWon: 100, adjustmentWon: 0, billedWon: 100, receivedWon: 0, outstandingWon: 100, status: "Overdue" };

it("sums every confirmed charge and keeps overdue ahead of paid", () => {
  expect(summarizeTenantCharges([charge, { ...charge, id: "paid", status: "Paid", receivedWon: 100, outstandingWon: 0 }], "t", "2026-09")).toMatchObject({ billedWon: 200, receivedWon: 100, outstandingWon: 100, status: "Overdue", confirmedCount: 2 });
});

it("excludes draft, cancelled, other tenants and other months from money totals", () => {
  expect(summarizeTenantCharges([charge, { ...charge, id: "d", status: "Draft" }, { ...charge, id: "x", status: "Cancelled" }, { ...charge, id: "other", tenantId: "other" }, { ...charge, id: "old", billingMonth: "2026-08" }], "t", "2026-09")).toMatchObject({ billedWon: 100, outstandingWon: 100, draftCount: 1, confirmedCount: 1 });
});

it("does not mark paid plus unpaid as paid or paid plus draft as fully settled", () => {
  const paid = { ...charge, status: "Paid" as const, outstandingWon: 0, receivedWon: 100 };
  expect(summarizeTenantCharges([paid, { ...charge, id: "unpaid", status: "Approved" }], "t", "2026-09").status).toBe("PartiallyPaid");
  expect(summarizeTenantCharges([paid, { ...charge, id: "draft", status: "Draft" }], "t", "2026-09").status).toBe("Draft");
});

it("distinguishes no charge, cancelled only, draft only and full settlement", () => {
  expect(summarizeTenantCharges([], "t", "2026-09").status).toBe("NoCharge");
  expect(summarizeTenantCharges([{ ...charge, status: "Cancelled" }], "t", "2026-09").status).toBe("Cancelled");
  expect(summarizeTenantCharges([{ ...charge, status: "Draft" }], "t", "2026-09").status).toBe("Draft");
  expect(summarizeTenantCharges([{ ...charge, status: "Paid", outstandingWon: 0, receivedWon: 100 }], "t", "2026-09").status).toBe("Paid");
});
