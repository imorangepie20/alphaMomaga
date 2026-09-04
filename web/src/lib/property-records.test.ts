import { afterEach, expect, it, vi } from "vitest";
import { getPropertyRecords } from "./property-records";

vi.mock("./api-url", () => ({ getApiUrl: () => "http://localhost:3100" }));
afterEach(() => vi.unstubAllGlobals());

it("returns the actual records from all five resources", async () => {
  vi.stubGlobal("fetch", vi.fn(async (url: string) => new Response(JSON.stringify([{ id: url.split("/").at(-1) }]))));
  expect(await getPropertyRecords()).toEqual({
    properties: [{ id: "properties" }], tenants: [{ id: "tenants" }], contracts: [{ id: "contracts" }],
    maintenance: [{ id: "maintenance" }], inspections: [{ id: "inspections" }],
  });
});

it("rejects a partial outage instead of substituting sample records", async () => {
  vi.stubGlobal("fetch", vi.fn(async (url: string) => new Response("[]", { status: url.endsWith("contracts") ? 503 : 200 })));
  await expect(getPropertyRecords()).rejects.toThrow("contracts");
});

it("rejects network failures", async () => {
  vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new Error("offline")));
  await expect(getPropertyRecords()).rejects.toThrow("offline");
});
