import { beforeEach, afterEach, expect, it, vi } from "vitest";
import { POST } from "@/app/api/admin-users/[...path]/route";
import { auth0 } from "./auth0";
vi.mock("./auth0", () => ({ auth0: { getAccessToken: vi.fn() } }));
vi.mock("./api-url", () => ({ getApiUrl: () => "https://api.example.test" }));
const fetcher = vi.fn();
beforeEach(() => { vi.mocked(auth0.getAccessToken).mockResolvedValue({ token: "server-token", expiresAt: 0 }); vi.stubGlobal("fetch", fetcher); });
afterEach(() => { vi.clearAllMocks(); vi.unstubAllGlobals(); vi.unstubAllEnvs(); });
const request = (origin: string) => new Request("https://web.test/api/admin-users/user/role", { method: "POST", headers: { origin, "content-type": "application/json", authorization: "Bearer forged" }, body: '{"roleId":"finance"}' });
it("rejects cross origin management mutations", async () => {
  expect((await POST(request("https://evil.test"), { params: Promise.resolve({ path: ["user", "role"] }) })).status).toBe(403);
  expect(fetcher).not.toHaveBeenCalled();
});
it("uses only server credentials and encodes user identifiers", async () => {
  fetcher.mockResolvedValue(Response.json({ ok: true }));
  const response = await POST(request("https://web.test"), { params: Promise.resolve({ path: ["auth0|user", "role"] }) });
  expect(response.status).toBe(200);
  expect(response.headers.get("cache-control")).toBe("no-store");
  expect(fetcher).toHaveBeenCalledWith("https://api.example.test/admin/users/auth0%7Cuser/role", expect.objectContaining({ headers: { authorization: "Bearer server-token", "content-type": "application/json" } }));
});
it("rejects arbitrary administrative API commands", async () => {
  expect((await POST(request("https://web.test"), { params: Promise.resolve({ path: ["user", "delete"] }) })).status).toBe(404);
  expect(fetcher).not.toHaveBeenCalled();
});
it("does not forward unauthenticated mutations", async () => {
  vi.mocked(auth0.getAccessToken).mockRejectedValueOnce(new Error("expired"));
  expect((await POST(request("https://web.test"), { params: Promise.resolve({ path: ["user", "role"] }) })).status).toBe(401);
  expect(fetcher).not.toHaveBeenCalled();
});
it("accepts the configured public origin behind a localhost tunnel", async () => {
  vi.stubEnv("APP_BASE_URL", "https://public.example.test");
  fetcher.mockResolvedValue(Response.json({ ok: true }));
  const req = new Request("http://localhost:3001/api/admin-users/user/block", { method: "POST", headers: { origin: "https://public.example.test" }, body: "{}" });
  expect((await POST(req, { params: Promise.resolve({ path: ["user", "block"] }) })).status).toBe(200);
});
