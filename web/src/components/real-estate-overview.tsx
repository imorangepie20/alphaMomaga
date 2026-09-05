import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { getPropertyRecords } from "@/lib/property-records";
import { BillingApiError, getMonthlyCharges } from "@/lib/billing";
import { summarizeAssets, summarizeRevenue } from "@/lib/operational-dashboards";
import { contractTiming } from "@/lib/contract-overview";
import { buildWorkQueue } from "@/lib/dashboard-work-queue";

const won = (value: number) => `${value.toLocaleString("ko-KR")}원`;
const linkStyle = "text-sm underline underline-offset-4";

export async function RealEstateOverview() {
  const today = new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Seoul", year: "numeric", month: "2-digit", day: "2-digit" }).format(new Date());
  const month = today.slice(0, 7);
  let records: Awaited<ReturnType<typeof getPropertyRecords>>;
  try {
    records = await getPropertyRecords();
  } catch {
    return <div className="space-y-4"><h1 className="text-2xl font-semibold">부동산 관리 대시보드</h1><p role="alert">운영 현황을 불러오지 못했습니다. 잠시 후 다시 조회해 주세요.</p><Link href="/dashboard/real-estate" className={linkStyle}>다시 조회</Link></div>;
  }
  let billingError = "";
  let loginRequired = false;
  let revenue: ReturnType<typeof summarizeRevenue> | null = null;
  try {
    revenue = summarizeRevenue(records.properties, await getMonthlyCharges(month), month);
  } catch (error) {
    loginRequired = error instanceof BillingApiError && error.status === 401;
    billingError = loginRequired ? "다시 로그인하면 수납 현황을 확인할 수 있습니다." : error instanceof BillingApiError && error.status === 403 ? "수납 현황 조회 권한이 없습니다." : "수납 현황을 불러오지 못했습니다. 잠시 후 다시 조회해 주세요.";
  }
  const assets = summarizeAssets(records.properties, records.tenants, records.contracts, today);
  const chartRows = revenue?.rows.filter((row) => row.count > 0).sort((a, b) => b.billed - a.billed) ?? [];
  const chartMax = Math.max(1, ...chartRows.flatMap((row) => [row.billed, row.received, row.outstanding]));
  const queue = buildWorkQueue(records.maintenance, records.inspections, today);
  const expiring = records.contracts.filter((contract) => contractTiming(contract, today).expiring).sort((a, b) => a.endDate.localeCompare(b.endDate));
  const propertyName = (id: string) => records.properties.find((property) => property.id === id)?.name ?? "연결 자산 확인 필요";
  const tenantName = (id: string) => records.tenants.find((tenant) => tenant.id === id)?.name ?? "연결 임차인 확인 필요";
  const stats = [
    { label: "등록 자산", value: records.properties.length, href: "/dashboard/portfolio" },
    { label: "현재 유효 계약", value: records.contracts.filter((contract) => contractTiming(contract, today).active).length, href: "/contracts" },
    { label: "30일 내 만료 계약", value: expiring.length, href: "/contracts" },
    { label: "미완료 유지보수·점검", value: queue.length, href: "#work-queue" },
  ];

  return <div className="space-y-6">
    <header className="space-y-2"><h1 className="text-2xl font-semibold tracking-tight">부동산 관리 대시보드</h1><p className="text-sm text-muted-foreground">{today} 서울 기준 · 실제 등록 기록과 이번 달 청구를 확인합니다.</p></header>
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">{stats.map((stat) => <Card key={stat.label}><CardHeader><CardTitle className="text-sm font-medium"><Link href={stat.href} className="hover:underline">{stat.label}</Link></CardTitle></CardHeader><CardContent className="text-3xl font-semibold tabular-nums">{stat.value}</CardContent></Card>)}</div>
    <Card><CardHeader className="flex flex-wrap items-start justify-between gap-3 sm:flex-row"><div className="space-y-2"><CardTitle>{month} 청구·수납 현황</CardTitle><p className="text-sm text-muted-foreground">확정 청구 기준입니다. 수납은 해당 청구월에 배분된 금액입니다.</p></div><Link href={`/dashboard/revenue?billingMonth=${month}`} className={linkStyle}>월별 상세 보기</Link></CardHeader><CardContent>
      {revenue ? <div className="space-y-4"><dl className="grid gap-6 sm:grid-cols-3">{[["확정 청구", revenue.billed], ["수납", revenue.received], ["미수", revenue.outstanding]].map(([label, value]) => <div key={label}><dt className="text-sm text-muted-foreground">{label}</dt><dd className="mt-2 break-words text-2xl font-semibold tabular-nums">{won(Number(value))}</dd></div>)}</dl>
        <p className="text-sm">수납률 {revenue.collectionRate === null ? "산출 불가 (확정 청구 없음)" : `${revenue.collectionRate.toFixed(1)}%`} · 확정 대기 초안 {revenue.drafts}건</p>
        <Link href={`/payments?billingMonth=${month}`} className={linkStyle}>청구 확정·수납 처리</Link></div>
        : <div className="space-y-2"><p role="alert">{billingError}</p><a href={loginRequired ? "/auth/login" : "/dashboard/real-estate"} className={linkStyle}>{loginRequired ? "다시 로그인" : "다시 조회"}</a></div>}
    </CardContent></Card>
    <div className="grid items-start gap-6 xl:grid-cols-2">
      <Card><CardHeader className="space-y-2"><CardTitle>자산별 청구·수납 비교</CardTitle><p className="text-sm text-muted-foreground">{month} 확정 청구액 순 상위 8개 · 공통 금액 척도</p></CardHeader><CardContent className="space-y-5">
        <div className="flex flex-wrap gap-4 text-xs"><span>청구: 파랑</span><span>수납: 초록</span><span>미수: 주황</span></div>
        {chartRows.slice(0, 8).map((row) => <div key={row.id} className="space-y-2"><p className="text-sm font-medium">{row.name}</p><div role="img" aria-label={`${row.name}: 청구 ${won(row.billed)}, 수납 ${won(row.received)}, 미수 ${won(row.outstanding)}`} className="space-y-2">
          {[{ label: "청구", value: row.billed, color: "bg-blue-500" }, { label: "수납", value: row.received, color: "bg-emerald-500" }, { label: "미수", value: row.outstanding, color: "bg-amber-500" }].map((bar) => <div key={bar.label} className="grid grid-cols-[2rem_minmax(0,1fr)_auto] items-center gap-2 text-xs"><span>{bar.label}</span><div className="h-2.5 rounded bg-muted"><div className={`h-full rounded ${bar.color}`} style={{ width: `${bar.value / chartMax * 100}%` }} /></div><span className="tabular-nums">{won(bar.value)}</span></div>)}
        </div></div>)}
        {!chartRows.length && <p className="py-6 text-sm text-muted-foreground">{billingError || "확정 청구가 없어 비교 그래프를 표시할 수 없습니다."}</p>}
      </CardContent></Card>
      <Card><CardHeader className="space-y-2"><CardTitle>자산별 입력 점유율</CardTitle><p className="text-sm text-muted-foreground">0~100% 기준 · 입력 비율이 낮은 순 상위 8개</p></CardHeader><CardContent className="space-y-5">
        {assets.rows.filter((row) => row.occupancyValue !== null).sort((a, b) => a.occupancyValue! - b.occupancyValue!).slice(0, 8).map((row) => <div key={row.id} className="space-y-2"><div className="flex justify-between gap-3 text-sm"><span>{row.name}</span><span className="tabular-nums">{row.occupancyValue}%</span></div><div role="img" aria-label={`${row.name} 입력 점유율 ${row.occupancyValue}%`} className="h-3 rounded bg-muted"><div className="h-full rounded bg-blue-500" style={{ width: `${row.occupancyValue}%` }} /></div></div>)}
        {!assets.rows.some((row) => row.occupancyValue !== null) && <p className="py-6 text-sm text-muted-foreground">입력된 점유율 데이터가 없습니다.</p>}
        <p className="text-xs text-muted-foreground">입력 비율 비교이며 실제 호실 수 기반 점유율이나 과거 추이가 아닙니다. 미등록 값은 제외합니다.</p>
        <Link href="/dashboard/occupancy" className={linkStyle}>전체 점유율 확인</Link>
      </CardContent></Card>
    </div>
    <div className="grid items-start gap-6 xl:grid-cols-2">
      <Card id="work-queue"><CardHeader className="space-y-2"><CardTitle>우선 처리 업무</CardTitle><p className="text-sm text-muted-foreground">긴급 점검 우선, 기한 초과 후 예정일 순 · 미완료 {queue.length}건 중 최대 8건</p></CardHeader><CardContent>
        <ul className="divide-y">{queue.slice(0, 8).map((item) => <li key={item.id} className="flex flex-wrap items-start justify-between gap-3 py-3"><div className="space-y-1"><Link href={item.href} className="text-sm font-medium hover:underline">{item.title}</Link><p className="text-xs text-muted-foreground">{propertyName(item.propertyId)} · {item.kind} · {item.date}</p></div><span className={`text-xs ${item.urgent || item.overdue ? "text-destructive" : "text-muted-foreground"}`}>{[item.urgent && "긴급", item.overdue && "기한 초과", !item.urgent && !item.overdue && "예정"].filter(Boolean).join(" · ")}</span></li>)}</ul>
        {!queue.length && <p className="py-4 text-sm text-muted-foreground">미완료 유지보수·점검이 없습니다.</p>}
        <nav className="mt-4 flex gap-4" aria-label="업무 전체 목록"><Link href="/maintenance" className={linkStyle}>유지보수 전체</Link><Link href="/inspections" className={linkStyle}>점검 전체</Link></nav>
      </CardContent></Card>
      <Card><CardHeader className="space-y-2"><CardTitle>만료 임박 계약</CardTitle><p className="text-sm text-muted-foreground">현재 유효 계약 중 30일 내 만료 · {expiring.length}건 중 최대 8건</p></CardHeader><CardContent><ul className="divide-y">{expiring.slice(0, 8).map((contract) => <li key={contract.id} className="space-y-1 py-3"><p className="text-sm font-medium">{tenantName(contract.tenantId)} · {contract.unit}</p><p className="text-xs text-muted-foreground">{propertyName(contract.propertyId)} · {contract.endDate} 만료 · {contractTiming(contract, today).daysRemaining}일 남음</p></li>)}</ul>{!expiring.length && <p className="py-4 text-sm text-muted-foreground">30일 내 만료되는 유효 계약이 없습니다.</p>}<Link href="/contracts" className={linkStyle}>계약 검토·갱신</Link></CardContent></Card>
    </div>
    <Card><CardHeader className="space-y-2"><CardTitle>자산 운영 요약</CardTitle><p className="text-sm text-muted-foreground">점유율은 자산에 입력된 비율이며 실제 호실 수 기반 지표가 아닙니다.</p></CardHeader><CardContent><Table><TableHeader><TableRow>{["자산", "입력 점유율", "유효 계약", "만료 임박"].map((label) => <TableHead key={label}>{label}</TableHead>)}</TableRow></TableHeader><TableBody>{assets.rows.map((row) => <TableRow key={row.id}><TableCell>{row.name}</TableCell><TableCell>{row.occupancyValue === null ? "미등록" : `${row.occupancyValue}%`}</TableCell><TableCell>{row.active}</TableCell><TableCell>{row.expiring}</TableCell></TableRow>)}</TableBody></Table>{!assets.rows.length && <p className="py-4 text-sm text-muted-foreground">등록된 자산이 없습니다.</p>}<div className="mt-4"><Link href="/properties" className={linkStyle}>자산 관리</Link></div></CardContent></Card>
  </div>;
}
