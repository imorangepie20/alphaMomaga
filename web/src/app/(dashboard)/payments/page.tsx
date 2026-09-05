import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { BillingApiError, getBillingSummary, getMonthlyCharges, getPaymentReceipts, type MonthlyChargeStatus } from "@/lib/billing";
import { ReceiptManager } from "./receipt-manager";
import { ChargeActions } from "./charge-actions";
import { ReceiptHistory } from "./receipt-history";
import { BillingMonthSelector } from "./billing-month-selector";
import { BillingRunAction } from "./billing-run-action";
import { getTenants } from "@/lib/tenants";

export const dynamic = "force-dynamic";

function currentBillingMonth(): string {
  const parts = new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Seoul", year: "numeric", month: "2-digit" }).formatToParts(new Date());
  return `${parts.find((part) => part.type === "year")?.value}-${parts.find((part) => part.type === "month")?.value}`;
}

function formatWon(value: number): string { return `₩${value.toLocaleString("ko-KR")}`; }

function statusLabel(status: MonthlyChargeStatus): string {
  return ({ Draft: "확정 대기", Approved: "수납 대기", PartiallyPaid: "부분 수납", Paid: "수납 완료", Overdue: "연체", Cancelled: "취소" })[status];
}

function statusClass(status: MonthlyChargeStatus): string {
  if (status === "Paid") return "border-emerald-500/30 bg-emerald-500/10 text-emerald-700";
  if (status === "Overdue") return "border-red-500/30 bg-red-500/10 text-red-700";
  if (status === "Draft") return "border-slate-500/30 bg-slate-500/10 text-slate-700";
  return "border-amber-500/30 bg-amber-500/10 text-amber-700";
}

export default async function PaymentsPage({ searchParams }: { searchParams: Promise<{ billingMonth?: string }> }) {
  const billingMonth = (await searchParams).billingMonth ?? currentBillingMonth();
  let data;
  try {
    data = await Promise.all([getBillingSummary(billingMonth), getMonthlyCharges(billingMonth), getPaymentReceipts(billingMonth), getMonthlyCharges(), getTenants()]);
  } catch (error) {
    const message = error instanceof BillingApiError && error.status === 401 ? "로그인이 만료되었습니다. 다시 로그인한 뒤 수납 원장을 확인해 주세요." : "수납 원장을 불러오지 못했습니다. 잠시 후 다시 시도해 주세요.";
    return <div className="space-y-2"><h1 className="text-2xl font-semibold tracking-tight">수납 원장</h1><p role="alert" className="text-sm text-destructive">{message}</p></div>;
  }
    const [summary, charges, receipts, receiptCharges, tenants] = data;
    const tenantNames = Object.fromEntries(tenants.map((tenant) => [tenant.id, `${tenant.name} · ${tenant.unit}`]));
    return <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3"><div><h1 className="text-2xl font-semibold tracking-tight">수납 원장</h1><p className="text-sm text-muted-foreground">{billingMonth} 청구월의 확정 청구 기준 수납과 미수 현황입니다. 초안·취소 금액은 합계에서 제외됩니다.</p></div><BillingMonthSelector billingMonth={billingMonth} /></div>
      <div className="grid gap-4 sm:grid-cols-3">
        <Card><CardHeader><CardTitle>청구 금액</CardTitle></CardHeader><CardContent className="text-3xl font-semibold tabular-nums">{formatWon(summary.billedWon)}</CardContent></Card>
        <Card><CardHeader><CardTitle>수납 금액</CardTitle></CardHeader><CardContent className="text-3xl font-semibold tabular-nums">{formatWon(summary.receivedWon)}</CardContent></Card>
        <Card><CardHeader><CardTitle>미수 금액</CardTitle></CardHeader><CardContent className="text-3xl font-semibold tabular-nums">{formatWon(summary.outstandingWon)}</CardContent></Card>
      </div>
      <Card><CardHeader className="flex-row flex-wrap items-start justify-between gap-3"><div><CardTitle>월별 청구 원장</CardTitle><p className="mt-1 text-sm text-muted-foreground">청구 초안을 생성한 뒤 계약 조건을 검토하고 확정하면 수납을 등록할 수 있습니다.</p></div><div className="flex flex-wrap items-start justify-end gap-2"><BillingRunAction billingMonth={billingMonth} /><ReceiptManager charges={receiptCharges} tenantNames={tenantNames} /></div></CardHeader><CardContent className="px-0"><Table>
        <TableHeader><TableRow><TableHead className="pl-6">청구월</TableHead><TableHead>납부 기한</TableHead><TableHead>청구</TableHead><TableHead>수납</TableHead><TableHead>미수</TableHead><TableHead>상태</TableHead><TableHead className="pr-6 text-right">관리</TableHead></TableRow></TableHeader>
        <TableBody>
          {charges.map((charge) => <TableRow key={charge.id}><TableCell className="pl-6 font-medium">{charge.billingMonth}</TableCell><TableCell>{charge.dueDate}</TableCell><TableCell>{formatWon(charge.billedWon)}</TableCell><TableCell>{formatWon(charge.receivedWon)}</TableCell><TableCell>{formatWon(charge.outstandingWon)}</TableCell><TableCell><Badge variant="outline" className={statusClass(charge.status)}>{statusLabel(charge.status)}</Badge></TableCell><TableCell className="pr-6 text-right"><ChargeActions charge={charge} /></TableCell></TableRow>)}
          {charges.length === 0 && <TableRow><TableCell colSpan={7} className="h-28 text-center text-muted-foreground">선택한 청구월에 생성된 청구가 없습니다. 활성 계약이 있다면 청구 초안 생성으로 초안을 만들 수 있습니다.</TableCell></TableRow>}
        </TableBody>
      </Table></CardContent></Card>
      <Card><CardContent className="pt-6"><ReceiptHistory receipts={receipts} charges={charges} /></CardContent></Card>
    </div>;
}
