import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { getContractsWorkspace } from "@/lib/contracts-workspace";
import { BillingApiError, getMonthlyCharges } from "@/lib/billing";
import { summarizeAssets, summarizeRevenue } from "@/lib/operational-dashboards";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

const titles = { portfolio: "자산 현황", occupancy: "점유율", revenue: "수익 현황" };
const types: Record<string, string> = { Apartment: "아파트", Townhouse: "타운하우스", Officetel: "오피스텔", Commercial: "상업용" };
const won = (value: number) => `${value.toLocaleString("ko-KR")}원`;
const percent = (value: number | null) => value === null ? "산출 불가" : `${value.toFixed(1)}%`;

export async function OperationalDashboard({ mode, billingMonth }: { mode: keyof typeof titles; billingMonth?: string }) {
  const today = new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Seoul", year: "numeric", month: "2-digit", day: "2-digit" }).format(new Date());
  const month = billingMonth && /^[1-9][0-9]{3}-(0[1-9]|1[0-2])$/.test(billingMonth) ? billingMonth : today.slice(0, 7);
  let workspace: Awaited<ReturnType<typeof getContractsWorkspace>>;
  let charges: Awaited<ReturnType<typeof getMonthlyCharges>> = [];
  try {
    workspace = await getContractsWorkspace();
    if (mode === "revenue") charges = await getMonthlyCharges(month);
  } catch (error) {
    const message = error instanceof BillingApiError && error.status === 401 ? "로그인이 만료되었습니다. 다시 로그인해 주세요." : error instanceof BillingApiError && error.status === 403 ? "수납 현황 조회 권한이 없습니다." : "현황을 불러오지 못했습니다. 잠시 후 다시 조회해 주세요.";
    return <div className="space-y-4"><h1 className="text-2xl font-semibold">{titles[mode]}</h1><p role="alert">{message}</p><Link className="underline" href={error instanceof BillingApiError && error.status === 401 ? "/auth/login" : `/dashboard/${mode}`}>다시 조회</Link></div>;
  }
  const assets = summarizeAssets(workspace.properties, workspace.tenants, workspace.contracts, today);
  const revenue = summarizeRevenue(workspace.properties, charges, month);
  const active = assets.rows.reduce((sum, row) => sum + row.active, 0);
  const expiring = assets.rows.reduce((sum, row) => sum + row.expiring, 0);
  const stats = mode === "revenue" ? [["확정 청구", won(revenue.billed)], ["청구 배분 수납", won(revenue.received)], ["미수금", won(revenue.outstanding)], ["수납률", percent(revenue.collectionRate)]]
    : mode === "occupancy" ? [["입력 점유율 평균", percent(assets.averageOccupancy)], ["현재 유효 계약", active], ["30일 내 만료", expiring], ["점유율 미등록 자산", assets.rows.filter((row) => row.occupancyValue === null).length]]
    : [["등록 자산", assets.rows.length], ["등록 임차인", workspace.tenants.length], ["현재 유효 계약", active], ["30일 내 만료", expiring]];

  return <div className="space-y-6">
    <div className="flex flex-wrap items-end justify-between gap-4">
      <div><h1 className="text-2xl font-semibold tracking-tight">{titles[mode]}</h1><p className="mt-1 text-sm text-muted-foreground">{mode === "revenue" ? `${month} 청구월 기준 · 확정 청구와 수납 배분 현황` : `${today} 서울 기준 · 등록 자산과 실제 계약 현황`}</p></div>
      {mode === "revenue" && <form action="/dashboard/revenue" className="flex items-end gap-2"><div className="space-y-2"><label htmlFor="revenue-month" className="text-sm">청구월</label><Input id="revenue-month" type="month" name="billingMonth" defaultValue={month} key={month} min="1000-01" max="9999-12" required /></div><Button type="submit" variant="outline">조회</Button></form>}
    </div>
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">{stats.map(([label, value]) => <Card key={label}><CardHeader><CardTitle className="text-sm font-medium">{label}</CardTitle></CardHeader><CardContent className="break-words text-3xl font-semibold tabular-nums">{value}</CardContent></Card>)}</div>
    {mode === "portfolio" && <Card><CardHeader><CardTitle>자산 유형 구성</CardTitle></CardHeader><CardContent className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">{[...new Set(assets.rows.map((row) => row.type))].map((type) => <div key={type} className="space-y-2"><div className="flex justify-between text-sm"><span>{types[type] ?? type}</span><span>{assets.rows.filter((row) => row.type === type).length}개</span></div><div className="h-2 rounded bg-muted"><div className="h-2 rounded bg-primary" style={{ width: `${assets.rows.filter((row) => row.type === type).length / assets.rows.length * 100}%` }} /></div></div>)}{!assets.rows.length && <p className="text-sm text-muted-foreground">등록된 자산이 없습니다.</p>}</CardContent></Card>}
    <Card><CardHeader><CardTitle>{mode === "revenue" ? "자산별 청구·수납 내역" : "자산별 운영 현황"}</CardTitle></CardHeader><CardContent>
      {mode === "revenue" ? <Table><TableHeader><TableRow>{["자산", "확정 청구 건수", "청구", "수납", "미수", "연체 건수"].map((label) => <TableHead key={label}>{label}</TableHead>)}</TableRow></TableHeader><TableBody>{revenue.rows.map((row) => <TableRow key={row.id}><TableCell>{row.name}</TableCell><TableCell>{row.count}</TableCell><TableCell>{won(row.billed)}</TableCell><TableCell>{won(row.received)}</TableCell><TableCell>{won(row.outstanding)}</TableCell><TableCell>{row.overdue}</TableCell></TableRow>)}</TableBody></Table>
        : <Table><TableHeader><TableRow>{["자산 / 위치", "유형", "입력 점유율", "등록 임차인", "유효 계약", "30일 내 만료"].map((label) => <TableHead key={label}>{label}</TableHead>)}</TableRow></TableHeader><TableBody>{assets.rows.map((row) => <TableRow key={row.id}><TableCell><span className="font-medium">{row.name}</span><p className="text-xs text-muted-foreground">{row.location}</p></TableCell><TableCell>{types[row.type] ?? row.type}</TableCell><TableCell>{percent(row.occupancyValue)}</TableCell><TableCell>{row.tenants}</TableCell><TableCell>{row.active}</TableCell><TableCell>{row.expiring}</TableCell></TableRow>)}</TableBody></Table>}
      {mode === "revenue" && !revenue.rows.some((row) => row.count) && <p className="py-6 text-center text-sm text-muted-foreground">선택한 월에 확정된 청구가 없습니다.</p>}
      {mode !== "revenue" && !assets.rows.length && <p className="py-6 text-center text-sm text-muted-foreground">자산을 등록하면 운영 현황이 표시됩니다.</p>}
    </CardContent></Card>
    <div className="space-y-3 rounded-lg border bg-muted/30 p-4 text-sm">
      <h2 className="font-medium">집계 기준과 다음 업무</h2>
      <p className="text-muted-foreground">{mode === "revenue" ? `초안 ${revenue.drafts}건과 취소 청구는 금액에서 제외합니다. 수납은 선택 청구월에 배분된 금액으로, 해당 월 입금액이나 비용을 차감한 순이익이 아닙니다.` : "점유율은 자산에 입력한 비율의 단순 평균입니다. 총 호실 수와 입퇴실 이력이 없어 실제 공실 수·가중 점유율은 산출하지 않습니다. 유효 계약은 상태가 유효이면서 기준일이 계약 기간에 포함된 계약입니다."}</p>
      <nav aria-label="관련 업무" className="flex flex-wrap gap-4"><Link className="underline underline-offset-4" href="/properties">자산 관리</Link><Link className="underline underline-offset-4" href="/contracts">계약 확인</Link><Link className="underline underline-offset-4" href={`/payments?billingMonth=${month}`}>수납 원장</Link></nav>
    </div>
  </div>;
}
