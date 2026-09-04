export type ReceiptInput = {
  propertyId: string;
  tenantId: string;
  receivedDate: string;
  amountWon: number;
  method: "BankTransfer" | "Cash" | "Card" | "Other";
  reference?: string;
  memo?: string;
  allocations: { chargeId: string; amountWon: number }[];
};

export class BillingMutationError extends Error {
  constructor(readonly status: number) { super(`Billing mutation failed with status ${status}`); }
}

export async function recordReceipt(input: ReceiptInput): Promise<void> {
  if (!Number.isSafeInteger(input.amountWon) || input.amountWon <= 0 || input.allocations.length === 0 || input.allocations.reduce((total, allocation) => total + allocation.amountWon, 0) !== input.amountWon) {
    throw new Error("Receipt amount and allocations must match");
  }
  const response = await fetch("/api/billing/payment-receipts", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(input) });
  if (!response.ok) throw new BillingMutationError(response.status);
}

async function post(path: string, body?: unknown): Promise<void> {
  const response = await fetch(path, {
    method: "POST",
    headers: body === undefined ? undefined : { "content-type": "application/json" },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  if (!response.ok) throw new BillingMutationError(response.status);
}

export function approveCharge(id: string): Promise<void> {
  return post(`/api/billing/monthly-charges/${encodeURIComponent(id)}/approve`);
}

export function cancelCharge(id: string, reason: string): Promise<void> {
  if (!reason.trim()) throw new Error("Cancellation reason is required");
  return post(`/api/billing/monthly-charges/${encodeURIComponent(id)}/cancel`, { reason: reason.trim() });
}

export function voidReceipt(id: string, reason: string): Promise<void> {
  if (!reason.trim()) throw new Error("Void reason is required");
  return post(`/api/billing/payment-receipts/${encodeURIComponent(id)}/void`, { reason: reason.trim() });
}
