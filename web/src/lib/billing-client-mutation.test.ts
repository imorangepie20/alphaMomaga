import { beforeEach, describe, expect, it, vi } from "vitest";
import { approveCharge, cancelCharge, voidReceipt } from "./billing-client-mutation";

const mockFetch = vi.fn();

describe("billing lifecycle mutations", () => {
  beforeEach(() => { vi.resetAllMocks(); vi.stubGlobal("fetch", mockFetch); mockFetch.mockResolvedValue(new Response(null, { status: 204 })); });

  it("posts a charge approval through the billing proxy", async () => {
    await approveCharge("charge-1");
    expect(mockFetch).toHaveBeenCalledWith("/api/billing/monthly-charges/charge-1/approve", expect.objectContaining({ method: "POST" }));
  });

  it("posts required cancellation and void reasons through the billing proxy", async () => {
    await cancelCharge("charge-1", "duplicate charge");
    await voidReceipt("receipt-1", "duplicate receipt");
    expect(mockFetch).toHaveBeenCalledWith("/api/billing/monthly-charges/charge-1/cancel", expect.objectContaining({ body: JSON.stringify({ reason: "duplicate charge" }) }));
    expect(mockFetch).toHaveBeenCalledWith("/api/billing/payment-receipts/receipt-1/void", expect.objectContaining({ body: JSON.stringify({ reason: "duplicate receipt" }) }));
  });
});
