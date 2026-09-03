import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getProperties } from "@/lib/properties";
import { PropertyManager } from "./property-manager";

export const dynamic = "force-dynamic";

export default async function PropertiesPage() {
  const properties = await getProperties();
  const averageOccupancy = properties.length
    ? Math.round(properties.reduce((total, property) => total + Number.parseInt(property.occupancy, 10), 0) / properties.length)
    : 0;
  const propertiesNeedingReview = properties.filter((property) => property.status === "Pending").length;

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">매물</h1>
        <p className="text-sm text-muted-foreground">관리 중인 자산과 점유 현황을 확인합니다.</p>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card><CardHeader><CardTitle>전체 자산</CardTitle></CardHeader><CardContent className="text-3xl font-bold">{properties.length}</CardContent></Card>
        <Card><CardHeader><CardTitle>평균 점유율</CardTitle></CardHeader><CardContent className="text-3xl font-bold">{averageOccupancy}%</CardContent></Card>
        <Card><CardHeader><CardTitle>검토 필요</CardTitle></CardHeader><CardContent className="text-3xl font-bold">{propertiesNeedingReview}</CardContent></Card>
      </div>

      <Card>
        <CardContent className="px-0 pb-0"><PropertyManager properties={properties} /></CardContent>
      </Card>
    </div>
  );
}
