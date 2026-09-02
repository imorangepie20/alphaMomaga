import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { getProperties } from "@/lib/properties";

export const dynamic = "force-dynamic";

export default async function PropertiesPage() {
  const properties = await getProperties();
  const averageOccupancy = properties.length
    ? Math.round(
        properties.reduce(
          (total, property) => total + Number.parseInt(property.occupancy, 10),
          0,
        ) / properties.length,
      )
    : 0;
  const propertiesNeedingReview = properties.filter(
    (property) => property.status === "Pending",
  ).length;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">매물</h1>
          <p className="text-sm text-muted-foreground">관리 자산과 점유 현황을 확인합니다</p>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader><CardTitle>전체 자산</CardTitle></CardHeader>
          <CardContent className="text-3xl font-bold">{properties.length}</CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle>평균 점유율</CardTitle></CardHeader>
          <CardContent className="text-3xl font-bold">{averageOccupancy}%</CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle>검토 필요</CardTitle></CardHeader>
          <CardContent className="text-3xl font-bold">{propertiesNeedingReview}</CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>자산 목록</CardTitle>
        </CardHeader>
        <CardContent className="px-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="pl-6">자산명</TableHead>
                <TableHead>위치</TableHead>
                <TableHead>유형</TableHead>
                <TableHead>점유율</TableHead>
                <TableHead>상태</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {properties.map((property) => (
                <TableRow key={property.id}>
                  <TableCell className="pl-6 font-medium">{property.name}</TableCell>
                  <TableCell>{property.location}</TableCell>
                  <TableCell>{property.type}</TableCell>
                  <TableCell>{property.occupancy}</TableCell>
                  <TableCell>
                    <Badge variant="outline" className={property.status === "Occupied" ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300" : "border-amber-500/30 bg-amber-500/10 text-amber-700 dark:text-amber-300"}>
                      {property.status === "Occupied" ? "점유" : property.status === "Active" ? "운영 중" : "검토 중"}
                    </Badge>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
