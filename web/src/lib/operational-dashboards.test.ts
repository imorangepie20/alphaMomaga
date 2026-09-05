import { describe, expect, it } from "vitest";
import { summarizeAssets, summarizeRevenue } from "./operational-dashboards";
import type { Property } from "./properties";
import type { Contract } from "./contracts";
import type { MonthlyCharge } from "./billing";

const property: Property = { id: "p", name: "자산", location: "서울", type: "Apartment", occupancy: "80%", status: "Active" };
const contract: Contract = { id: "c", propertyId: "p", tenantId: "t", unit: "101", monthlyRent: "₩100,000", startDate: "2026-01-01", endDate: "2026-09-30", status: "Active" };
const charge: MonthlyCharge = { id: "b", propertyId: "p", tenantId: "t", contractId: "c", billingMonth: "2026-09", dueDate: "2026-09-01", baseRentWon: 100, adjustmentWon: 0, billedWon: 100, receivedWon: 40, outstandingWon: 60, status: "Overdue" };

describe("operational dashboards", () => {
  it("counts only contracts effective on the reference date", () => {
    const result = summarizeAssets([property], [], [contract, { ...contract, id: "future", startDate: "2027-01-01" }, { ...contract, id: "ended", status: "Terminated" }], "2026-09-05");
    expect(result.rows[0].active).toBe(1);
    expect(result.rows[0].expiring).toBe(1);
    expect(result.averageOccupancy).toBe(80);
  });
  it("does not invent occupancy for empty or invalid data", () => {
    expect(summarizeAssets([], [], [], "2026-09-05").averageOccupancy).toBeNull();
    expect(summarizeAssets([{ ...property, occupancy: "unknown" }], [], [], "2026-09-05").averageOccupancy).toBeNull();
  });
  it("excludes other months, drafts and cancelled charges but retains unlinked assets", () => {
    const result = summarizeRevenue([property], [charge, { ...charge, id: "draft", status: "Draft" }, { ...charge, id: "cancel", status: "Cancelled" }, { ...charge, id: "old", billingMonth: "2026-08" }, { ...charge, id: "orphan", propertyId: "missing" }], "2026-09");
    expect(result.billed).toBe(200);
    expect(result.received).toBe(80);
    expect(result.outstanding).toBe(120);
    expect(result.drafts).toBe(1);
    expect(result.rows).toHaveLength(2);
    expect(result.collectionRate).toBe(40);
  });
  it("keeps no-charge collection rate undefined rather than 100 percent", () => {
    expect(summarizeRevenue([property], [], "2026-09").collectionRate).toBeNull();
  });
});
