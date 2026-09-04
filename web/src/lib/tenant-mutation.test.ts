import { beforeEach, describe, expect, it, vi } from "vitest";
import { saveTenant } from "./tenant-mutation";

const mockFetch = vi.fn();

describe("saveTenant", () => {
  beforeEach(() => {
    vi.resetAllMocks();
    vi.stubGlobal("fetch", mockFetch);
  });

  it("uses the protected tenant proxy for create and update", async () => {
    mockFetch.mockResolvedValue(new Response(null, { status: 201 }));
    const input = {
      name: "Kim Jisu",
      propertyId: "property-1",
      unit: "A-202",
      rent: 1100000,
    };
    await saveTenant(input);
    expect(mockFetch).toHaveBeenLastCalledWith(
      "/api/proxy/tenants",
      expect.objectContaining({ method: "POST" }),
    );
    await saveTenant(input, "tenant-1");
    expect(mockFetch).toHaveBeenLastCalledWith(
      "/api/proxy/tenants/tenant-1",
      expect.objectContaining({ method: "PUT" }),
    );
  });
});
