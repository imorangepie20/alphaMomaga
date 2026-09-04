import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("./auth0", () => ({ auth0: { getAccessToken: vi.fn() } }));
vi.mock("./api-url", () => ({ getApiUrl: vi.fn() }));

import { auth0 } from "./auth0";
import { getApiUrl } from "./api-url";
import { BillingApiError, getBillingSummary, getMonthlyCharges, getPaymentReceipts } from "./billing";

const mockFetch = vi.fn();
const mockGetAccessToken = vi.mocked(auth0.getAccessToken);
const mockGetApiUrl = vi.mocked(getApiUrl);

describe("billing server reads", () => {
  beforeEach(() => {
    vi.resetAllMocks();
    vi.stubGlobal("fetch", mockFetch);
    mockGetApiUrl.mockReturnValue("https://api.approid.team");
    mockGetAccessToken.mockResolvedValue({ token: "access-token", expiresAt: 0 });
  });

  it("reads selected-month charges with the server session access token", async () => {
    mockFetch.mockResolvedValue(new Response(JSON.stringify([{ id: "charge-1" }]), { status: 200 }));

    await expect(getMonthlyCharges("2026-09")).resolves.toEqual([{ id: "charge-1" }]);

    const [url, options] = mockFetch.mock.calls[0] as [URL, RequestInit];
    expect(url.toString()).toBe("https://api.approid.team/monthly-charges?billingMonth=2026-09");
    expect(new Headers(options.headers).get("authorization")).toBe("Bearer access-token");
  });

  it("reads all charges when a receipt allocation needs prior-month balances", async () => {
    mockFetch.mockResolvedValue(new Response(JSON.stringify([]), { status: 200 }));

    await expect(getMonthlyCharges()).resolves.toEqual([]);

    const [url] = mockFetch.mock.calls[0] as [URL, RequestInit];
    expect(url.toString()).toBe("https://api.approid.team/monthly-charges");
  });

  it("surfaces unauthorized billing reads instead of falling back to fixture payments", async () => {
    mockFetch.mockResolvedValue(new Response(null, { status: 401 }));

    await expect(getBillingSummary("2026-09")).rejects.toEqual(new BillingApiError(401));
  });

  it("reads receipt history scoped to the selected billing month", async () => {
    mockFetch.mockResolvedValue(new Response(JSON.stringify([]), { status: 200 }));

    await expect(getPaymentReceipts("2026-09")).resolves.toEqual([]);

    const [url] = mockFetch.mock.calls[0] as [URL, RequestInit];
    expect(url.toString()).toBe("https://api.approid.team/payment-receipts?billingMonth=2026-09");
  });
});
