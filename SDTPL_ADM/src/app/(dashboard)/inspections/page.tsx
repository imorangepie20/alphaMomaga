import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getInspections } from "@/lib/inspections";
import { getProperties } from "@/lib/properties";

export const dynamic = "force-dynamic";

export default async function InspectionsPage() {
  const [inspections, properties] = await Promise.all([getInspections(), getProperties()]);
  const propertyNames = new Map(properties.map((property) => [property.id, property.name]));
  const scheduled = inspections.filter((item) => item.status === "Scheduled").length;
  const completed = inspections.filter((item) => item.status === "Completed").length;
  const needsReview = inspections.filter((item) => item.status === "InReview").length;
  const urgent = inspections.filter((item) => item.priority === "Urgent").length;
  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">점검</h1>
        <p className="text-sm text-muted-foreground">안전 점검과 법규 준수 현황을 관리합니다</p>
      </div>
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <Card>
          <CardHeader><CardTitle>점검 예정</CardTitle></CardHeader>
          <CardContent className="text-3xl font-bold">{scheduled}</CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle>점검 완료</CardTitle></CardHeader>
          <CardContent className="text-3xl font-bold">{completed}</CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle>검토 필요</CardTitle></CardHeader>
          <CardContent className="text-3xl font-bold">{needsReview}</CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle>긴급</CardTitle></CardHeader>
          <CardContent className="text-3xl font-bold">{urgent}</CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>점검 일정</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {inspections.map((item) => (
            <div key={item.id} className="flex items-center justify-between rounded-lg border p-3">
              <div>
                <div className="font-medium">{propertyNames.get(item.propertyId) ?? "연결되지 않은 자산"}</div>
                <div className="text-sm text-muted-foreground">{item.type}</div>
              </div>
              <div className="text-sm text-muted-foreground">{item.scheduledDate}</div>
              <div className="text-sm font-medium">{item.status === "Completed" ? "완료" : item.status === "InReview" ? "검토 중" : item.status === "Scheduled" ? "예정" : "대기"}</div>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
