import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getContractsWorkspace } from "@/lib/contracts-workspace";
import { contractTiming } from "@/lib/contract-overview";
import { ContractManager } from "./contract-manager";

export const dynamic = "force-dynamic";

export default async function ContractsPage() {
  const today = new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Seoul", year: "numeric", month: "2-digit", day: "2-digit" }).format(new Date());
  let workspace: Awaited<ReturnType<typeof getContractsWorkspace>>;
  try {
    workspace = await getContractsWorkspace();
  } catch {
    return <div className="space-y-4"><h1 className="text-2xl font-semibold tracking-tight">계약</h1><p role="alert" className="text-sm text-destructive">계약과 연결된 임차인·자산 정보를 불러오지 못했습니다. 잠시 후 다시 시도해 주세요.</p><Link href="/contracts" className="text-sm underline">다시 불러오기</Link></div>;
  }
  const timing = workspace.contracts.map((contract) => contractTiming(contract, today));
  const stats = [
    ["전체 계약", workspace.contracts.length],
    ["유효 계약", timing.filter((item) => item.active).length],
    ["갱신 검토 (120일 내)", timing.filter((item) => item.renewal).length],
    ["만료 임박 (30일 내)", timing.filter((item) => item.expiring).length],
  ] as const;
  return <div className="space-y-6">
    <div><h1 className="text-2xl font-semibold tracking-tight">계약</h1><p className="text-sm text-muted-foreground">계약을 등록하고 갱신 일정, 계약 상태와 해지일을 관리합니다.</p></div>
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">{stats.map(([label, value]) => <Card key={label}><CardHeader><CardTitle>{label}</CardTitle></CardHeader><CardContent className="text-3xl font-semibold tabular-nums">{value}</CardContent></Card>)}</div>
    <p className="text-sm text-muted-foreground">{today} 기준 · 갱신 검토와 만료 임박은 현재 유효한 계약 기준이며, 30일 내 만료는 120일 내 갱신 검토에 포함됩니다. 지표는 전체 계약 기준입니다.</p>
    <Card><CardContent className="p-0"><ContractManager {...workspace} today={today} /></CardContent></Card>
  </div>;
}
