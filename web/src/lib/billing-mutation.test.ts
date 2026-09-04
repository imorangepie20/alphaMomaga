import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("./auth0", () => ({ auth0: { getAccessToken: vi.fn() } }));
vi.mock("./api-url", () => ({ getApiUrl: vi.fn() }));

import { auth0 } from "./auth0";
import { getApiUrl } from "./api-url";
import { forwardBillingMutation } from "./billing-mutation";

const mockFetch = vi.fn();

describe("forwardBillingMutation", () => {
  beforeEach(() => {
    vi.resetAllMocks();
    vi.stubGlobal("fetch", mockFetch);
    vi.mocked(getApiUrl).mockReturnValue("https://api.approid.team");
    vi.mocked(auth0.getAccessToken).mockResolvedValue({ token: "access-token", expiresAt: 0 });
  });

  it("forwards an approved receipt registration path with the server token", async () => {
    mockFetch.mockResolvedValue(new Response(JSON.stringify({ id: "receipt-1" }), { status: 201 }));
    const response = await forwardBillingMutation("payment-receipts", new Request("https://web.test", { method: "POST", body: "{}", headers: { "content-type": "application/json" } }));
    expect(response.status).toBe(201);
    const [url, options] = mockFetch.mock.calls[0] as [URL, RequestInit];
    expect(url.toString()).toBe("https://api.approid.team/payment-receipts");
    expect(new Headers(options.headers).get("authorization")).toBe("Bearer access-token");
  });

  it("rejects arbitrary API paths", async () => {
    await expect(forwardBillingMutation("users", new Request("https://web.test", { method: "POST" }))).resolves.toMatchObject({ status: 404 });
  });
});
