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
import { getMaintenance } from "@/lib/maintenance";
import { getProperties } from "@/lib/properties";

export const dynamic = "force-dynamic";

export default async function MaintenancePage() {
  const [maintenance, properties] = await Promise.all([getMaintenance(), getProperties()]);
  const propertyNames = new Map(properties.map((property) => [property.id, property.name]));
  const openTasks = maintenance.filter((item) => item.status !== "Completed").length;
  const inProgress = maintenance.filter((item) => item.status === "InProgress").length;
  const completed = maintenance.filter((item) => item.status === "Completed").length;
  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">유지보수</h1>
        <p className="text-sm text-muted-foreground">점검 업무와 수리 요청을 관리합니다</p>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader><CardTitle>미완료 작업</CardTitle></CardHeader>
          <CardContent className="text-3xl font-bold">{openTasks}</CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle>진행 중</CardTitle></CardHeader>
          <CardContent className="text-3xl font-bold">{inProgress}</CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle>완료</CardTitle></CardHeader>
          <CardContent className="text-3xl font-bold">{completed}</CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>작업 요청</CardTitle>
        </CardHeader>
        <CardContent className="px-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="pl-6">자산명</TableHead>
                <TableHead>작업 내용</TableHead>
                <TableHead>예정일</TableHead>
                <TableHead>상태</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {maintenance.map((item) => (
                <TableRow key={item.id}>
                  <TableCell className="pl-6 font-medium">{propertyNames.get(item.propertyId) ?? "연결되지 않은 자산"}</TableCell>
                  <TableCell>{item.task}</TableCell>
                  <TableCell>{item.dueDate}</TableCell>
                  <TableCell>
                    <Badge
                      variant="outline"
                      className={
                        item.status === "Completed"
                          ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300"
                          : item.status === "InProgress"
                            ? "border-blue-500/30 bg-blue-500/10 text-blue-700 dark:text-blue-300"
                            : item.status === "Scheduled"
                              ? "border-amber-500/30 bg-amber-500/10 text-amber-700 dark:text-amber-300"
                              : "border-slate-500/30 bg-slate-500/10 text-slate-700 dark:text-slate-300"
                      }
                    >
                      {item.status === "Completed" ? "완료" : item.status === "In Progress" ? "진행 중" : item.status === "Scheduled" ? "예정" : "대기"}
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
