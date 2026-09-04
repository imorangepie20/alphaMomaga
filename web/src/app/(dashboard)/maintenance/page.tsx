import Link from "next/link";
import { getMaintenanceWorkspace } from "@/lib/maintenance-workspace";
import { MaintenanceManager } from "./maintenance-manager";

export const dynamic = "force-dynamic";

export default async function MaintenancePage() {
  const today = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Seoul", year: "numeric", month: "2-digit", day: "2-digit",
  }).format(new Date());
  let workspace: Awaited<ReturnType<typeof getMaintenanceWorkspace>>;
  try {
    workspace = await getMaintenanceWorkspace();
  } catch {
    return <div className="space-y-4">
      <h1 className="text-2xl font-semibold tracking-tight">유지보수</h1>
      <p role="alert" className="text-sm text-destructive">작업과 자산 정보를 불러오지 못했습니다. 잠시 후 다시 시도해 주세요.</p>
      <Link href="/maintenance" className="text-sm underline">다시 불러오기</Link>
    </div>;
  }
  return <div className="space-y-6">
    <div><h1 className="text-2xl font-semibold tracking-tight">유지보수</h1><p className="text-sm text-muted-foreground">수리 요청을 등록하고 일정을 조정하며 작업 시작부터 완료까지 관리합니다.</p></div>
    <MaintenanceManager {...workspace} today={today} />
  </div>;
}
