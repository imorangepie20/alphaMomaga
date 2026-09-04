import type { MonthlyCharge, MonthlyChargeStatus } from "./billing";

export type TenantLedgerStatus = MonthlyChargeStatus | "NoCharge";
export const tenantLedgerLabels: Record<TenantLedgerStatus, string> = {
  NoCharge: "청구 없음", Draft: "승인 대기", Approved: "미납", PartiallyPaid: "부분 납부", Paid: "납부 완료", Overdue: "연체", Cancelled: "취소됨",
};

export function summarizeTenantCharges(charges: MonthlyCharge[], tenantId: string, billingMonth: string) {
  const monthlyCharges = charges.filter((charge) => charge.tenantId === tenantId && charge.billingMonth === billingMonth);
  const confirmed = monthlyCharges.filter((charge) => charge.status !== "Draft" && charge.status !== "Cancelled");
  const draftCount = monthlyCharges.filter((charge) => charge.status === "Draft").length;
  const billedWon = confirmed.reduce((sum, charge) => sum + charge.billedWon, 0);
  const receivedWon = confirmed.reduce((sum, charge) => sum + charge.receivedWon, 0);
  const outstandingWon = confirmed.reduce((sum, charge) => sum + charge.outstandingWon, 0);
  let status: TenantLedgerStatus;
  if (confirmed.some((charge) => charge.status === "Overdue" && charge.outstandingWon > 0)) status = "Overdue";
  else if (outstandingWon > 0) status = receivedWon > 0 ? "PartiallyPaid" : "Approved";
  else if (draftCount > 0) status = "Draft";
  else if (confirmed.length > 0) status = "Paid";
  else status = monthlyCharges.length > 0 ? "Cancelled" : "NoCharge";
  return { billedWon, receivedWon, outstandingWon, draftCount, confirmedCount: confirmed.length, status, charges: monthlyCharges };
}
