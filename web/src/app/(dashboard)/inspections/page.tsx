import Link from "next/link";
import { getInspectionWorkspace } from "@/lib/inspections-workspace";
import { InspectionManager } from "./inspection-manager";

export const dynamic = "force-dynamic";

export default async function InspectionsPage() {
  const today = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Seoul", year: "numeric", month: "2-digit", day: "2-digit",
  }).format(new Date());
  let workspace: Awaited<ReturnType<typeof getInspectionWorkspace>>;
  try {
    workspace = await getInspectionWorkspace();
  } catch {
    return <div className="space-y-4">
      <h1 className="text-2xl font-semibold tracking-tight">점검</h1>
      <p role="alert" className="text-sm text-destructive">점검과 자산 정보를 불러오지 못했습니다. 잠시 후 다시 시도해 주세요.</p>
      <Link href="/inspections" className="text-sm underline">다시 불러오기</Link>
    </div>;
  }
  return <div className="space-y-6">
    <div><h1 className="text-2xl font-semibold tracking-tight">점검</h1><p className="text-sm text-muted-foreground">점검 일정을 등록하고 긴급도, 검토 상태와 실제 완료일을 관리합니다.</p></div>
    <InspectionManager {...workspace} today={today} />
  </div>;
}
