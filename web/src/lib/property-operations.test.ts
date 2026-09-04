import { describe, expect, it } from "vitest";
import { buildPropertyOperations } from "./property-operations";

describe("buildPropertyOperations", () => {
  it("excludes drafts, cancellations and other months from receivables", () => {
    const charge = { id: "c", propertyId: "p", tenantId: "t", contractId: "k", billingMonth: "2026-09", dueDate: "2026-09-01", baseRentWon: 100, adjustmentWon: 0, billedWon: 100, receivedWon: 20, outstandingWon: 80 };
    const result = buildPropertyOperations({
      properties: [{ id: "p", name: "House", location: "Seoul", type: "House", occupancy: "0%", status: "Active" }],
      tenants: [], contracts: [], maintenance: [], inspections: [], today: "2026-09-05",
      charges: [
        { ...charge, status: "PartiallyPaid" },
        { ...charge, id: "draft", status: "Draft" },
        { ...charge, id: "cancelled", status: "Cancelled" },
        { ...charge, id: "previous", billingMonth: "2026-08", status: "Overdue" },
      ],
    });
    expect(result.rows[0]).toMatchObject({ billedWon: 100, receivedWon: 20, outstandingWon: 80, draftCount: 1 });
    expect(result.summary.outstandingWon).toBe(80);
  });

  it("counts only contracts effective on the reference date and includes the 90-day boundary", () => {
    const contract = { id: "c", propertyId: "p", tenantId: "t", unit: "101", monthlyRent: "100", startDate: "2026-01-01", endDate: "2026-12-04", status: "Active" as const };
    const result = buildPropertyOperations({
      properties: [{ id: "p", name: "House", location: "Seoul", type: "House", occupancy: "0%", status: "Active" }],
      tenants: [], charges: [], maintenance: [], inspections: [], today: "2026-09-05",
      contracts: [contract, { ...contract, id: "future", startDate: "2026-10-01" }, { ...contract, id: "past", endDate: "2026-09-04" }, { ...contract, id: "terminated", status: "Terminated" }, { ...contract, id: "later", endDate: "2026-12-05" }],
    });
    expect(result.rows[0]).toMatchObject({ activeContractCount: 2, expiringContractCount: 1 });
  });

  it("combines current-month receivables, active contracts, deadlines, and open work by property", () => {
    const result = buildPropertyOperations({
      properties: [
        { id: "property-1", name: "Seoul Heights", location: "Seoul", type: "Apartment", occupancy: "96%", status: "Occupied" },
        { id: "property-2", name: "Hana Village", location: "Busan", type: "Townhouse", occupancy: "80%", status: "Pending" },
      ],
      tenants: [
        { id: "tenant-1", name: "Kim", propertyId: "property-1", unit: "101", rent: "₩1,200,000", status: "Paid" },
        { id: "tenant-2", name: "Park", propertyId: "property-2", unit: "201", rent: "₩980,000", status: "Overdue" },
      ],
      contracts: [
        { id: "contract-1", propertyId: "property-1", tenantId: "tenant-1", unit: "101", monthlyRent: "₩1,200,000", startDate: "2026-01-01", endDate: "2027-01-01", status: "Active" },
        { id: "contract-2", propertyId: "property-2", tenantId: "tenant-2", unit: "201", monthlyRent: "₩980,000", startDate: "2026-01-01", endDate: "2026-10-15", status: "Active" },
      ],
      charges: [
        { id: "charge-1", propertyId: "property-1", tenantId: "tenant-1", contractId: "contract-1", billingMonth: "2026-09", dueDate: "2026-09-01", baseRentWon: 1200000, adjustmentWon: 0, billedWon: 1200000, receivedWon: 1200000, outstandingWon: 0, status: "Paid" },
        { id: "charge-2", propertyId: "property-2", tenantId: "tenant-2", contractId: "contract-2", billingMonth: "2026-09", dueDate: "2026-09-01", baseRentWon: 980000, adjustmentWon: 0, billedWon: 980000, receivedWon: 0, outstandingWon: 980000, status: "Overdue" },
      ],
      maintenance: [{ id: "maintenance-1", propertyId: "property-2", task: "Leak repair", dueDate: "2026-09-10", status: "InProgress" }],
      inspections: [{ id: "inspection-1", propertyId: "property-2", type: "Electrical", scheduledDate: "2026-09-12", status: "Pending", priority: "Urgent" }],
      today: "2026-09-04",
    });

    expect(result.summary).toMatchObject({
      propertyCount: 2,
      averageOccupancy: 88,
      outstandingWon: 980000,
      actionRequiredCount: 1,
    });
    expect(result.rows).toEqual(expect.arrayContaining([
      expect.objectContaining({ id: "property-1", activeContractCount: 1, tenantCount: 1, billedWon: 1200000, receivedWon: 1200000, outstandingWon: 0, expiringContractCount: 0, openWorkCount: 0 }),
      expect.objectContaining({ id: "property-2", activeContractCount: 1, tenantCount: 1, billedWon: 980000, receivedWon: 0, outstandingWon: 980000, expiringContractCount: 1, openWorkCount: 2, needsAttention: true }),
    ]));
  });

  it("does not invent vacancy counts when the property model has no unit capacity", () => {
    const result = buildPropertyOperations({
      properties: [{ id: "property-1", name: "Seoul Heights", location: "Seoul", type: "Apartment", occupancy: "0%", status: "Active" }],
      tenants: [], contracts: [], charges: [], maintenance: [], inspections: [], today: "2026-09-04",
    });

    expect(result.rows[0]).not.toHaveProperty("vacantUnitCount");
    expect(result.rows[0]).toMatchObject({ tenantCount: 0, activeContractCount: 0, outstandingWon: 0, openWorkCount: 0 });
  });
});
