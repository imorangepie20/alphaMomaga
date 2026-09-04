import { afterEach, expect, it, vi } from "vitest";
import { getContractsWorkspace } from "./contracts-workspace";
vi.mock("./api-url", () => ({ getApiUrl: () => "http://localhost:3100" }));
afterEach(() => vi.unstubAllGlobals());
it("loads the three related resources", async () => {
  vi.stubGlobal("fetch", vi.fn(async (url: string) => new Response(JSON.stringify([{ id: url.split("/").at(-1) }]))));
  expect(await getContractsWorkspace()).toEqual({ contracts: [{ id: "contracts" }], tenants: [{ id: "tenants" }], properties: [{ id: "properties" }] });
});
it.each(["contracts", "tenants", "properties"])("rejects a %s outage instead of substituting sample data", async (resource) => {
  vi.stubGlobal("fetch", vi.fn(async (url: string) => new Response("[]", { status: url.endsWith(resource) ? 503 : 200 })));
  await expect(getContractsWorkspace()).rejects.toThrow(resource);
});
