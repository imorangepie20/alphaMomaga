import { beforeEach, describe, expect, it, vi } from "vitest";
import { approveCharge, cancelCharge, recordReceipt, voidReceipt } from "./billing-client-mutation";

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

  it("preserves receipt reference and memo evidence", async () => {
    await recordReceipt({ propertyId: "property-1", tenantId: "tenant-1", receivedDate: "2026-09-04", amountWon: 400000, method: "BankTransfer", reference: "BANK-20260904-01", memo: "September partial payment", allocations: [{ chargeId: "charge-1", amountWon: 400000 }] });

    const [, options] = mockFetch.mock.calls[0] as [string, RequestInit];
    expect(JSON.parse(options.body as string)).toMatchObject({ reference: "BANK-20260904-01", memo: "September partial payment" });
  });
});
