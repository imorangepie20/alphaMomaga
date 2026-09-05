import { afterEach, expect, it, vi } from "vitest";
import { getMaintenanceWorkspace } from "./maintenance-workspace";
vi.mock("./api-url", () => ({ getApiUrl: () => "http://localhost:3100" }));
afterEach(() => vi.unstubAllGlobals());

it("loads only maintenance and property records", async () => {
  const fetchMock = vi.fn(async (url: string) => new Response(JSON.stringify([{ id: url.split("/").at(-1) }])));
  vi.stubGlobal("fetch", fetchMock);
  expect(await getMaintenanceWorkspace()).toEqual({ items: [{ id: "maintenance" }], properties: [{ id: "properties" }] });
  expect(fetchMock).toHaveBeenCalledTimes(2);
});

it.each(["maintenance", "properties"])("fails visibly when %s cannot be loaded", async (resource) => {
  vi.stubGlobal("fetch", vi.fn(async (url: string) => new Response("[]", { status: url.endsWith(resource) ? 503 : 200 })));
  await expect(getMaintenanceWorkspace()).rejects.toThrow(resource);
});
vi.mock("./auth0", () => ({ auth0: { getAccessToken: vi.fn(async () => ({ token: "server-token" })) } }));
