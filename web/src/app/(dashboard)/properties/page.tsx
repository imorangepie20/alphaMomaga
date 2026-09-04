import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BillingApiError, getMonthlyCharges } from "@/lib/billing";
import { getPropertyRecords } from "@/lib/property-records";
import { buildPropertyOperations } from "@/lib/property-operations";
import { PropertyManager } from "./property-manager";

export const dynamic = "force-dynamic";

function currentDateInSeoul() {
  return new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Seoul", year: "numeric", month: "2-digit", day: "2-digit" }).format(new Date());
}

function formatWon(value: number) {
  return `₩${value.toLocaleString("ko-KR")}`;
}

export default async function PropertiesPage() {
  const today = currentDateInSeoul();
  const billingMonth = today.slice(0, 7);
  let operations: ReturnType<typeof buildPropertyOperations>;
  try {
    const [records, charges] = await Promise.all([
      getPropertyRecords(),
      getMonthlyCharges(billingMonth),
    ]);
    operations = buildPropertyOperations({ ...records, charges, today });
  } catch (error) {
    const message = error instanceof BillingApiError && error.status === 401 ? "로그인이 만료되었습니다. 다시 로그인한 뒤 자산 운영 현황을 확인해 주세요." : "자산 운영 현황을 불러오지 못했습니다. 잠시 후 다시 시도해 주세요.";
    return <div className="space-y-2"><h1 className="text-2xl font-semibold tracking-tight">매물</h1><p role="alert" className="text-sm text-destructive">{message}</p></div>;
  }

    return (
      <div className="space-y-6">
        <div className="flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
          <div><h1 className="text-2xl font-semibold tracking-tight">매물</h1><p className="text-sm text-muted-foreground">{billingMonth} 기준 자산, 계약, 수납, 운영 업무를 함께 확인합니다.</p></div>
          <p className="text-sm text-muted-foreground">청구월 {billingMonth}</p>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <Card><CardHeader><CardTitle>전체 자산</CardTitle></CardHeader><CardContent className="text-3xl font-semibold">{operations.summary.propertyCount}</CardContent></Card>
          <Card><CardHeader><CardTitle>평균 점유율</CardTitle></CardHeader><CardContent className="text-3xl font-semibold">{operations.summary.averageOccupancy}%</CardContent></Card>
          <Card><CardHeader><CardTitle>이달 미수금</CardTitle></CardHeader><CardContent className="text-3xl font-semibold">{formatWon(operations.summary.outstandingWon)}</CardContent></Card>
          <Card><CardHeader><CardTitle>조치 필요 자산</CardTitle></CardHeader><CardContent className="text-3xl font-semibold">{operations.summary.actionRequiredCount}</CardContent></Card>
        </div>

        {operations.summary.actionRequiredCount > 0 && <Card className="border-amber-200 bg-amber-50/40"><CardContent className="flex flex-col gap-1 py-4 text-sm sm:flex-row sm:items-center sm:justify-between"><span className="font-medium">우선 확인할 자산이 {operations.summary.actionRequiredCount}개 있습니다.</span><span className="text-muted-foreground">미수금, 90일 이내 계약 만료, 미처리 유지보수·점검, 검토 상태를 확인해 주세요.</span></CardContent></Card>}

        <Card><CardContent className="px-0 pb-0"><PropertyManager properties={operations.rows} /></CardContent></Card>
      </div>
    );
}
