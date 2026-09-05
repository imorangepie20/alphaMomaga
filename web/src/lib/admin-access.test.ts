import { afterEach, expect, it, vi } from "vitest";
import { getAdminAccess } from "./admin-access";
import { getRoles } from "./roles";
import { auth0 } from "./auth0";

vi.mock("server-only", () => ({}));
vi.mock("./auth0", () => ({ auth0: { getAccessToken: vi.fn(async () => ({ token: "server-token" })) } }));
vi.mock("./api-url", () => ({ getApiUrl: () => "https://api.example.test" }));
vi.mock("./roles", () => ({ getRoles: vi.fn(async () => [{ name: "Finance", permissions: ["report:read"] }]) }));
afterEach(() => { vi.unstubAllGlobals(); vi.clearAllMocks(); });

it("checks verified API role instead of trusting browser role", async () => {
  const fetcher = vi.fn(async () => Response.json({ role: "Finance", subject: "user" }));
  vi.stubGlobal("fetch", fetcher);
  await expect(getAdminAccess("user:manage")).rejects.toMatchObject({ status: 403 });
  expect(fetcher).toHaveBeenCalledWith("https://api.example.test/auth/me", expect.objectContaining({ headers: { authorization: "Bearer server-token" } }));
});

it("allows an explicitly granted report permission", async () => {
  vi.stubGlobal("fetch", vi.fn(async () => Response.json({ role: "Finance", subject: "user" })));
  await expect(getAdminAccess("report:read")).resolves.toMatchObject({ role: { name: "Finance" } });
});

it("does not substitute fallback permissions when roles API fails", async () => {
  vi.stubGlobal("fetch", vi.fn(async () => Response.json({ role: "Finance", subject: "user" })));
  vi.mocked(getRoles).mockRejectedValueOnce(new Error("offline"));
  await expect(getAdminAccess()).rejects.toThrow("offline");
});

it("requires a session token before fetching account data", async () => {
  vi.mocked(auth0.getAccessToken).mockRejectedValueOnce(new Error("expired"));
  const fetcher = vi.fn();
  vi.stubGlobal("fetch", fetcher);
  await expect(getAdminAccess()).rejects.toMatchObject({ status: 401 });
  expect(fetcher).not.toHaveBeenCalled();
});
