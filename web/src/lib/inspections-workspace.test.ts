import { afterEach, expect, it, vi } from "vitest";
import { getInspectionWorkspace } from "./inspections-workspace";
vi.mock("./api-url", () => ({ getApiUrl: () => "http://localhost:3100" }));
afterEach(() => vi.unstubAllGlobals());

it("loads only inspections and property records", async () => {
  const fetchMock = vi.fn(async (url: string) => new Response(JSON.stringify([{ id: url.split("/").at(-1) }])));
  vi.stubGlobal("fetch", fetchMock);
  expect(await getInspectionWorkspace()).toEqual({ items: [{ id: "inspections" }], properties: [{ id: "properties" }] });
  expect(fetchMock).toHaveBeenCalledTimes(2);
});

it.each(["inspections", "properties"])("fails visibly when %s cannot be loaded", async (resource) => {
  vi.stubGlobal("fetch", vi.fn(async (url: string) => new Response("[]", { status: url.endsWith(resource) ? 503 : 200 })));
  await expect(getInspectionWorkspace()).rejects.toThrow(resource);
});
vi.mock("./auth0", () => ({ auth0: { getAccessToken: vi.fn(async () => ({ token: "server-token" })) } }));
