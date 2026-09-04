import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BillingApiError, getMonthlyCharges } from "@/lib/billing";
import { getProperties } from "@/lib/properties";
import { getTenants } from "@/lib/tenants";
import { TenantManager } from "./tenant-manager";

export const dynamic = "force-dynamic";

function currentBillingMonth() {
  return new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Seoul", year: "numeric", month: "2-digit" }).format(new Date()).slice(0, 7);
}

export default async function TenantsPage({ searchParams }: { searchParams: Promise<{ billingMonth?: string }> }) {
  const billingMonth = (await searchParams).billingMonth ?? currentBillingMonth();
  try {
    const [tenants, properties, charges] = await Promise.all([getTenants(), getProperties(), getMonthlyCharges(billingMonth)]);
    const paid = charges.filter((charge) => charge.status === "Paid").length;
    const overdue = charges.filter((charge) => charge.status === "Overdue").length;
    const outstandingWon = charges.reduce((total, charge) => total + charge.outstandingWon, 0);
    return <div className="space-y-6"><div><h1 className="text-2xl font-semibold tracking-tight">임차인</h1><p className="text-sm text-muted-foreground">{billingMonth} 청구월의 수납 사실과 임차인 기본 정보를 함께 확인합니다.</p></div>
      <div className="grid gap-4 md:grid-cols-4"><Card><CardHeader><CardTitle>전체 임차인</CardTitle></CardHeader><CardContent className="text-3xl font-semibold">{tenants.length}</CardContent></Card><Card><CardHeader><CardTitle>납부 완료</CardTitle></CardHeader><CardContent className="text-3xl font-semibold">{paid}</CardContent></Card><Card><CardHeader><CardTitle>연체</CardTitle></CardHeader><CardContent className="text-3xl font-semibold">{overdue}</CardContent></Card><Card><CardHeader><CardTitle>미수금</CardTitle></CardHeader><CardContent className="text-3xl font-semibold">₩{outstandingWon.toLocaleString("ko-KR")}</CardContent></Card></div>
      <Card><CardContent className="p-0"><TenantManager tenants={tenants} properties={properties} charges={charges} billingMonth={billingMonth} /></CardContent></Card>
    </div>;
  } catch (error) {
    const message = error instanceof BillingApiError && error.status === 401 ? "로그인이 만료되었습니다. 다시 로그인한 뒤 임차인 수납 현황을 확인해 주세요." : "임차인 수납 현황을 불러오지 못했습니다. 잠시 후 다시 시도해 주세요.";
    return <div className="space-y-2"><h1 className="text-2xl font-semibold tracking-tight">임차인</h1><p role="alert" className="text-sm text-destructive">{message}</p></div>;
  }
}
