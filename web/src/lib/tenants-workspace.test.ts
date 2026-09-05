import { afterEach, expect, it, vi } from "vitest";
import { getTenantWorkspace } from "./tenants-workspace";
vi.mock("./api-url", () => ({ getApiUrl: () => "http://localhost:3100" }));
afterEach(() => vi.unstubAllGlobals());

it("loads only tenants and property records", async () => {
  const fetchMock = vi.fn(async (url: string) => new Response(JSON.stringify([{ id: url.split("/").at(-1) }])));
  vi.stubGlobal("fetch", fetchMock);
  expect(await getTenantWorkspace()).toEqual({ tenants: [{ id: "tenants" }], properties: [{ id: "properties" }] });
  expect(fetchMock).toHaveBeenCalledTimes(2);
});

it.each(["tenants", "properties"])("fails visibly when %s cannot be loaded", async (resource) => {
  vi.stubGlobal("fetch", vi.fn(async (url: string) => new Response("[]", { status: url.endsWith(resource) ? 503 : 200 })));
  await expect(getTenantWorkspace()).rejects.toThrow(resource);
});
vi.mock("./auth0", () => ({ auth0: { getAccessToken: vi.fn(async () => ({ token: "server-token" })) } }));
