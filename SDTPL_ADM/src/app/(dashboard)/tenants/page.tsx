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
import { getTenants } from "@/lib/tenants";

export const dynamic = "force-dynamic";

export default async function TenantsPage() {
  const tenants = await getTenants();
  const paidTenants = tenants.filter((tenant) => tenant.status === "Paid").length;
  const overdueTenants = tenants.filter((tenant) => tenant.status === "Overdue").length;

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">임차인</h1>
        <p className="text-sm text-muted-foreground">점유 현황, 계약, 수납 상태를 확인합니다</p>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader><CardTitle>전체 임차인</CardTitle></CardHeader>
          <CardContent className="text-3xl font-bold">{tenants.length}</CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle>이번 달 납부</CardTitle></CardHeader>
          <CardContent className="text-3xl font-bold">{paidTenants}</CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle>연체</CardTitle></CardHeader>
          <CardContent className="text-3xl font-bold">{overdueTenants}</CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>임차인 목록</CardTitle>
        </CardHeader>
        <CardContent className="px-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="pl-6">임차인</TableHead>
                <TableHead>세대</TableHead>
                <TableHead>월 임대료</TableHead>
                <TableHead>수납 상태</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {tenants.map((tenant) => (
                <TableRow key={tenant.id}>
                  <TableCell className="pl-6 font-medium">{tenant.name}</TableCell>
                  <TableCell>{tenant.unit}</TableCell>
                  <TableCell>{tenant.rent}</TableCell>
                  <TableCell>
                    <Badge
                      variant="outline"
                      className={
                        tenant.status === "Paid"
                          ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300"
                          : tenant.status === "Overdue"
                            ? "border-red-500/30 bg-red-500/10 text-red-700 dark:text-red-300"
                            : "border-amber-500/30 bg-amber-500/10 text-amber-700 dark:text-amber-300"
                      }
                    >
                      {tenant.status === "Paid" ? "납부 완료" : tenant.status === "Overdue" ? "연체" : "미납"}
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
