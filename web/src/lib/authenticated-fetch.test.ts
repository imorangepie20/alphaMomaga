import { afterEach, expect, it, vi } from "vitest";
import { authenticatedFetch } from "./authenticated-fetch";
import { auth0 } from "./auth0";
vi.mock("./auth0", () => ({ auth0: { getAccessToken: vi.fn(async () => ({ token: "server-token" })) } }));
vi.mock("./api-url", () => ({ getApiUrl: () => "http://localhost:3100" }));
afterEach(() => { vi.unstubAllGlobals(); vi.clearAllMocks(); });
it("uses the server token and disables caching", async () => {
  const fetchMock = vi.fn().mockResolvedValue(new Response("[]"));
  vi.stubGlobal("fetch", fetchMock);
  await authenticatedFetch("http://localhost:3100/tenants", { cache: "force-cache" });
  expect(fetchMock).toHaveBeenCalledWith("http://localhost:3100/tenants", {
    cache: "no-store", headers: { authorization: "Bearer server-token" }, redirect: "error",
  });
});
it("never requests records when session token retrieval fails", async () => {
  vi.mocked(auth0.getAccessToken).mockRejectedValueOnce(new Error("Expired"));
  const fetchMock = vi.fn(); vi.stubGlobal("fetch", fetchMock);
  await expect(authenticatedFetch("http://localhost:3100/tenants")).rejects.toThrow();
  expect(fetchMock).not.toHaveBeenCalled();
});
it("does not send the token to an unconfigured origin", async () => {
  await expect(authenticatedFetch("https://other.invalid/tenants")).rejects.toThrow();
  expect(auth0.getAccessToken).not.toHaveBeenCalled();
});
