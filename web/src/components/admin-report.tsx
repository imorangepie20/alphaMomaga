import { getAdminAccess } from "@/lib/admin-access";
import { getMonthlyCharges } from "@/lib/billing";
import { getContractsWorkspace } from "@/lib/contracts-workspace";
import { summarizeRevenue } from "@/lib/operational-dashboards";
import { AdminAccessNotice } from "./admin-access-error";
import { ReportExport } from "./report-export";
import { Card, CardHeader, CardTitle, CardContent } from "./ui/card";
import { Input } from "./ui/input";
import { Button } from "./ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "./ui/table";

export async function AdminReport({ billingMonth }: { billingMonth?: string }) {
  const current = new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Seoul", year: "numeric", month: "2-digit" }).format(new Date());
  const month = billingMonth && /^[1-9][0-9]{3}-(0[1-9]|1[0-2])$/.test(billingMonth) ? billingMonth : current;
  let report: ReturnType<typeof summarizeRevenue>;
  try {
    await getAdminAccess("report:read");
    const workspace = await getContractsWorkspace();
    report = summarizeRevenue(workspace.properties, await getMonthlyCharges(month), month);
  } catch (error) { return <AdminAccessNotice error={error} />; }
  const headers = ["청구월", "자산", "확정 청구 건수", "청구(원)", "수납(원)", "미수(원)", "연체 건수"];
  const rows = report.rows.map((row) => [month, row.name, row.count, row.billed, row.received, row.outstanding, row.overdue]);
  return <div className="space-y-6"><header className="space-y-2"><h1 className="text-2xl font-semibold">월별 수납 보고서</h1><p className="text-sm text-muted-foreground">{month} 확정 청구 기준 · 조회 시점까지의 배분 수납과 미수입니다.</p></header>
    <form className="flex flex-wrap items-end gap-3" action="/admin/reports"><div className="space-y-2"><label htmlFor="report-month" className="text-sm">청구월</label><Input id="report-month" name="billingMonth" type="month" defaultValue={month} key={month} required min="1000-01" max="9999-12" /></div><Button type="submit">조회</Button><ReportExport month={month} rows={[headers, ...rows]} /></form>
    <div className="grid gap-4 sm:grid-cols-3">{[["청구 합계", report.billed], ["수납 합계", report.received], ["미수 합계", report.outstanding]].map(([label, amount]) => <Card key={label}><CardHeader><CardTitle className="text-sm font-medium">{label}</CardTitle></CardHeader><CardContent className="text-2xl font-semibold tabular-nums">{Number(amount).toLocaleString("ko-KR")}원</CardContent></Card>)}</div>
    <Card><CardHeader><CardTitle>자산별 명세</CardTitle></CardHeader><CardContent><Table><TableHeader><TableRow>{headers.map((header) => <TableHead key={header}>{header}</TableHead>)}</TableRow></TableHeader><TableBody>{rows.map((row, i) => <TableRow key={report.rows[i].id}>{row.map((value, j) => <TableCell key={j}>{typeof value === "number" ? value.toLocaleString("ko-KR") : value}</TableCell>)}</TableRow>)}</TableBody></Table>{!report.rows.some((row) => row.count) && <p className="py-5 text-sm text-muted-foreground">선택 월에 확정된 청구가 없습니다.</p>}</CardContent></Card>
    <p className="text-sm text-muted-foreground">초안 {report.drafts}건과 취소 청구는 금액에서 제외합니다. 이 보고서는 입금일 기준 현금흐름·순이익·확정 결산서가 아니며 수납 취소나 추가 배분에 따라 달라집니다. CSV는 화면과 동일한 조회 결과입니다.</p>
  </div>;
}
