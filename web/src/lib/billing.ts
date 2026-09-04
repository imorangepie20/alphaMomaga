import "server-only";

import { auth0 } from "./auth0";
import { getApiUrl } from "./api-url";

export type MonthlyChargeStatus = "Draft" | "Approved" | "PartiallyPaid" | "Paid" | "Overdue" | "Cancelled";

export type MonthlyCharge = {
  id: string;
  propertyId: string;
  tenantId: string;
  contractId: string;
  billingMonth: string;
  dueDate: string;
  baseRentWon: number;
  adjustmentWon: number;
  billedWon: number;
  receivedWon: number;
  outstandingWon: number;
  status: MonthlyChargeStatus;
};

export type BillingSummary = {
  billingMonth: string;
  billedWon: number;
  receivedWon: number;
  outstandingWon: number;
  draftCount: number;
  approvedCount: number;
  partiallyPaidCount: number;
  paidCount: number;
  overdueCount: number;
  cancelledCount: number;
};

export class BillingApiError extends Error {
  constructor(readonly status: number) {
    super(`Billing API request failed with status ${status}`);
  }
}

async function getBilling<T>(path: string): Promise<T> {
  const apiUrl = getApiUrl();
  if (!apiUrl) throw new BillingApiError(503);

  let token: string;
  try {
    token = (await auth0.getAccessToken()).token;
  } catch {
    throw new BillingApiError(401);
  }

  let response: Response;
  try {
    response = await fetch(new URL(path, `${apiUrl.replace(/\/$/, "")}/`), {
      headers: { authorization: `Bearer ${token}` },
      cache: "no-store",
    });
  } catch {
    throw new BillingApiError(502);
  }
  if (!response.ok) throw new BillingApiError(response.status);
  return response.json() as Promise<T>;
}

export function getMonthlyCharges(billingMonth: string): Promise<MonthlyCharge[]> {
  return getBilling<MonthlyCharge[]>(`monthly-charges?billingMonth=${encodeURIComponent(billingMonth)}`);
}

export function getBillingSummary(billingMonth: string): Promise<BillingSummary> {
  return getBilling<BillingSummary>(`billing-summary?billingMonth=${encodeURIComponent(billingMonth)}`);
}
