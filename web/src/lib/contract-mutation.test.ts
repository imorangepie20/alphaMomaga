import { beforeEach, describe, expect, it, vi } from "vitest";
import { createContract, updateContract } from "./contract-mutation";

const mockFetch = vi.fn();

describe("contract mutations", () => {
  beforeEach(() => {
    vi.resetAllMocks();
    vi.stubGlobal("fetch", mockFetch);
  });

  it("creates a contract through the protected proxy with formatted monthly rent", async () => {
    mockFetch.mockResolvedValue(new Response(null, { status: 201 }));

    await createContract({
      propertyId: "property-1",
      tenantId: "tenant-1",
      unit: "A-202",
      monthlyRent: 1100000,
      startDate: "2026-10-01",
      endDate: "2027-09-30",
      status: "Upcoming",
    });

    expect(mockFetch).toHaveBeenCalledWith(
      "/api/proxy/contracts",
      expect.objectContaining({
        method: "POST",
        body: JSON.stringify({
          propertyId: "property-1",
          tenantId: "tenant-1",
          unit: "A-202",
          monthlyRent: "₩1,100,000",
          startDate: "2026-10-01",
          endDate: "2027-09-30",
          status: "Upcoming",
        }),
      }),
    );
  });

  it("updates contract lifecycle fields through the protected item proxy", async () => {
    mockFetch.mockResolvedValue(new Response(null, { status: 200 }));

    await updateContract("contract-1", {
      status: "Terminated",
      terminatedAt: "2026-09-04",
    });

    expect(mockFetch).toHaveBeenCalledWith(
      "/api/proxy/contracts/contract-1",
      expect.objectContaining({
        method: "PUT",
        body: JSON.stringify({
          status: "Terminated",
          terminatedAt: "2026-09-04",
        }),
      }),
    );
  });
});
