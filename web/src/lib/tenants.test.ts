import { afterEach, expect, it, vi } from "vitest";
import { getTenants } from "./tenants";
import { getApiUrl } from "./api-url";

vi.mock("./api-url", () => ({ getApiUrl: vi.fn(() => "http://localhost:3100/") }));
afterEach(() => { vi.unstubAllGlobals(); vi.mocked(getApiUrl).mockReturnValue("http://localhost:3100/"); });

it("returns actual records without caching or a duplicate URL slash", async () => {
  const records = [{ id: "real-tenant", name: "Actual tenant" }];
  const fetchMock = vi.fn().mockResolvedValue(new Response(JSON.stringify(records)));
  vi.stubGlobal("fetch", fetchMock);
  expect(await getTenants()).toEqual(records);
  expect(fetchMock).toHaveBeenCalledWith("http://localhost:3100/tenants", { cache: "no-store", headers: { authorization: "Bearer server-token" }, redirect: "error" });
});

it("preserves a valid empty directory", async () => {
  vi.stubGlobal("fetch", vi.fn().mockResolvedValue(new Response("[]")));
  expect(await getTenants()).toEqual([]);
});

it("rejects missing API configuration instead of returning sample tenants", async () => {
  vi.mocked(getApiUrl).mockReturnValue(undefined);
  await expect(getTenants()).rejects.toThrow("configured");
});

it.each([401, 403, 500, 503])("rejects HTTP %s instead of returning sample tenants", async (status) => {
  vi.stubGlobal("fetch", vi.fn().mockResolvedValue(new Response("[]", { status })));
  await expect(getTenants()).rejects.toThrow(String(status));
});

it("propagates network failures", async () => {
  vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new Error("Network unavailable")));
  await expect(getTenants()).rejects.toThrow("Network unavailable");
});

it("rejects a malformed directory payload", async () => {
  vi.stubGlobal("fetch", vi.fn().mockResolvedValue(new Response('{"error":"unavailable"}')));
  await expect(getTenants()).rejects.toThrow("Invalid");
});
vi.mock("./auth0", () => ({ auth0: { getAccessToken: vi.fn(async () => ({ token: "server-token" })) } }));
