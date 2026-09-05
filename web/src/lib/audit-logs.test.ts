import { afterEach, expect, it, vi } from "vitest";
import { getAuditLogs } from "./audit-logs";
import { auth0 } from "./auth0";

vi.mock("./auth0", () => ({ auth0: { getAccessToken: vi.fn(async () => ({ token: "test-token" })) } }));
vi.mock("./api-url", () => ({ getApiUrl: () => "http://localhost:3100" }));
afterEach(() => { vi.unstubAllGlobals(); vi.clearAllMocks(); });

it("encodes exact filters and uses an uncached authenticated server request", async () => {
  const fetchMock = vi.fn(async () => new Response("[]"));
  vi.stubGlobal("fetch", fetchMock);
  await expect(getAuditLogs({ entityId: "id&limit=100", actorSubject: "auth0|test", limit: 51, offset: 50 })).resolves.toEqual([]);
  const [url, options] = (fetchMock.mock.calls as unknown as [string, RequestInit][])[0];
  const parsed = new URL(url);
  expect(parsed.pathname).toBe("/admin/audit-logs");
  expect(parsed.searchParams.get("entityId")).toBe("id&limit=100");
  expect(parsed.searchParams.getAll("limit")).toEqual(["51"]);
  expect(parsed.searchParams.get("actorSubject")).toBe("auth0|test");
  expect(options).toMatchObject({ cache: "no-store", redirect: "error", headers: { authorization: "Bearer test-token" } });
});

it.each([401, 403, 500])("preserves API failure %s instead of showing an empty history", async (status) => {
  vi.stubGlobal("fetch", vi.fn(async () => new Response("{}", { status })));
  await expect(getAuditLogs({ limit: 51, offset: 0 })).rejects.toMatchObject({ status });
});

it("does not request logs after session token failure", async () => {
  vi.mocked(auth0.getAccessToken).mockRejectedValueOnce(new Error("Session expired"));
  const fetchMock = vi.fn();
  vi.stubGlobal("fetch", fetchMock);
  await expect(getAuditLogs({ limit: 51, offset: 0 })).rejects.toThrow("Session expired");
  expect(fetchMock).not.toHaveBeenCalled();
});
