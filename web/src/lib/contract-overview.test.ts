import { expect, it } from "vitest";
import { contractTiming } from "./contract-overview";
import type { Contract } from "./contracts";
const contract: Contract = { id: "c", propertyId: "p", tenantId: "t", unit: "101", monthlyRent: "₩100,000", startDate: "2026-01-01", endDate: "2026-10-05", status: "Active" };
it("includes day 30 in expiring contracts and day 120 in renewal review", () => {
  expect(contractTiming(contract, "2026-09-05")).toMatchObject({ active: true, expiring: true, renewal: true, daysRemaining: 30 });
  expect(contractTiming({ ...contract, endDate: "2027-01-03" }, "2026-09-05")).toMatchObject({ expiring: false, renewal: true, daysRemaining: 120 });
  expect(contractTiming({ ...contract, endDate: "2027-01-04" }, "2026-09-05").renewal).toBe(false);
});
it("does not count past, future or terminated contracts as active or expiring", () => {
  for (const item of [{ ...contract, endDate: "2026-09-04" }, { ...contract, startDate: "2026-10-01" }, { ...contract, status: "Terminated" as const }]) {
    expect(contractTiming(item, "2026-09-05")).toMatchObject({ active: false, expiring: false, renewal: false });
  }
});
