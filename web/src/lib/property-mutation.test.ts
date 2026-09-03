import { beforeEach, describe, expect, it, vi } from "vitest";
import { saveProperty, PropertyMutationError } from "./property-mutation";

const mockFetch = vi.fn();

describe("saveProperty", () => {
  beforeEach(() => {
    vi.resetAllMocks();
    vi.stubGlobal("fetch", mockFetch);
  });

  it("creates a property through the protected collection proxy", async () => {
    mockFetch.mockResolvedValue(new Response(JSON.stringify({ id: "property-5" }), { status: 201 }));

    await saveProperty({
      name: "Maple House",
      location: "Seoul, KR",
      type: "Apartment",
      occupancy: 75,
      status: "Active",
    });

    expect(mockFetch).toHaveBeenCalledWith("/api/proxy/properties", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        name: "Maple House",
        location: "Seoul, KR",
        type: "Apartment",
        occupancy: 75,
        status: "Active",
      }),
    });
  });

  it("updates a property through the protected item proxy", async () => {
    mockFetch.mockResolvedValue(new Response(JSON.stringify({ id: "property-1" }), { status: 200 }));

    await saveProperty(
      {
        name: "Seoul Heights Tower",
        location: "Seoul, KR",
        type: "Apartment",
        occupancy: 96,
        status: "Occupied",
      },
      "property-1",
    );

    expect(mockFetch).toHaveBeenCalledWith("/api/proxy/properties/property-1", {
      method: "PUT",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        name: "Seoul Heights Tower",
        location: "Seoul, KR",
        type: "Apartment",
        occupancy: 96,
        status: "Occupied",
      }),
    });
  });

  it("exposes an unauthorized proxy response to the UI", async () => {
    mockFetch.mockResolvedValue(new Response(null, { status: 401 }));

    await expect(
      saveProperty({ name: "Maple House", location: "Seoul, KR", type: "Apartment", occupancy: 75, status: "Active" }),
    ).rejects.toEqual(new PropertyMutationError(401));
  });
});
