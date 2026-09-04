import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { BillingApiError, getMonthlyCharges, type MonthlyCharge } from "@/lib/billing";
import { getTenantWorkspace } from "@/lib/tenants-workspace";
import { summarizeTenantCharges } from "@/lib/tenant-ledger-summary";
import { TenantManager } from "./tenant-manager";

export const dynamic = "force-dynamic";

export default async function TenantsPage({ searchParams }: { searchParams: Promise<{ billingMonth?: string | string[] }> }) {
  const requestedMonth = (await searchParams).billingMonth;
  const currentMonth = new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Seoul", year: "numeric", month: "2-digit" }).format(new Date()).slice(0, 7);
  const validMonth = typeof requestedMonth === "string" && /^[1-9][0-9]{3}-(0[1-9]|1[0-2])$/.test(requestedMonth);
  const billingMonth = validMonth ? requestedMonth : currentMonth;
  let workspace: Awaited<ReturnType<typeof getTenantWorkspace>> | undefined;
  let charges: MonthlyCharge[] = [];
  let errorMessage = "";
  try {
    [workspace, charges] = await Promise.all([getTenantWorkspace(), getMonthlyCharges(billingMonth)]);
  } catch (error) {
    errorMessage = error instanceof BillingApiError && error.status === 401
      ? "로그인이 만료되었습니다. 다시 로그인한 뒤 확인해 주세요."
      : "임차인 수납 현황을 불러오지 못했습니다. 잠시 후 다시 조회해 주세요.";
  }
  const ledgers = workspace?.tenants.map((tenant) => summarizeTenantCharges(charges, tenant.id, billingMonth)) ?? [];
  const stats = [
    ["전체 임차인 (명)", workspace?.tenants.length ?? 0],
    ["납부 완료 (명)", ledgers.filter((ledger) => ledger.status === "Paid").length],
    ["연체 (명)", ledgers.filter((ledger) => ledger.status === "Overdue").length],
    ["미수금", `₩${ledgers.reduce((sum, ledger) => sum + ledger.outstandingWon, 0).toLocaleString("ko-KR")}`],
  ] as const;

  return <div className="space-y-6">
    <div className="flex flex-wrap items-end justify-between gap-4">
      <div><h1 className="text-2xl font-semibold tracking-tight">임차인</h1><p className="text-sm text-muted-foreground">{billingMonth} 청구월의 임차인별 수납 현황입니다.</p></div>
      <form action="/tenants" method="get" className="flex items-end gap-2">
        <div className="space-y-2"><label htmlFor="tenant-billing-month" className="block text-sm">청구월</label><Input key={billingMonth} id="tenant-billing-month" name="billingMonth" type="month" min="1000-01" max="9999-12" defaultValue={billingMonth} required /></div>
        <Button type="submit">조회</Button>
      </form>
    </div>
    {requestedMonth !== undefined && !validMonth && <p role="status" className="text-sm text-muted-foreground">청구월 형식이 올바르지 않아 이번 달을 표시합니다.</p>}
    {errorMessage ? <p role="alert" className="text-sm text-destructive">{errorMessage}</p> : workspace && <>
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">{stats.map(([label, value]) => <Card key={label}><CardHeader><CardTitle>{label}</CardTitle></CardHeader><CardContent className="text-3xl font-semibold tabular-nums">{value}</CardContent></Card>)}</div>
      <p className="text-sm text-muted-foreground">지표는 전체 임차인 기준입니다. 한 임차인의 확정 청구를 모두 합산하며, 미수 또는 승인 대기가 있으면 납부 완료로 집계하지 않습니다.</p>
      <Card><CardContent className="p-0"><TenantManager key={billingMonth} tenants={workspace.tenants} properties={workspace.properties} charges={charges} billingMonth={billingMonth} /></CardContent></Card>
    </>}
  </div>;
}
