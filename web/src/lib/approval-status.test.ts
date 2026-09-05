import { expect, it, vi, afterEach } from "vitest";
import { getApprovalStatus } from "./approval-status";
import { authenticatedFetch } from "./authenticated-fetch";
vi.mock("./authenticated-fetch", () => ({ authenticatedFetch: vi.fn() }));
vi.mock("./api-url", () => ({ getApiUrl: () => "http://localhost:3100" }));
afterEach(() => vi.resetAllMocks());
it.each(["approved", "pending"] as const)("returns verified %s status", async (status) => {
  vi.mocked(authenticatedFetch).mockResolvedValue(new Response(JSON.stringify({ status })));
  expect(await getApprovalStatus()).toBe(status);
});
it("does not mistake service failure for pending approval", async () => {
  vi.mocked(authenticatedFetch).mockResolvedValue(new Response("{}", { status: 503 }));
  expect(await getApprovalStatus()).toBe("unavailable");
});
it("does not approve an unknown response", async () => {
  vi.mocked(authenticatedFetch).mockResolvedValue(new Response(JSON.stringify({ status: "anything" })));
  expect(await getApprovalStatus()).toBe("unavailable");
});
