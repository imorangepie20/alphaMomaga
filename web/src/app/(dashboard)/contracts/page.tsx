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
import { getContracts } from "@/lib/contracts";
import { getTenants } from "@/lib/tenants";

export const dynamic = "force-dynamic";

export default async function ContractsPage() {
  const [contracts, tenants] = await Promise.all([getContracts(), getTenants()]);
  const tenantNames = new Map(tenants.map((tenant) => [tenant.id, tenant.name]));
  const today = new Date("2026-09-02T00:00:00.000Z");
  const renewalWindow = new Date(today);
  renewalWindow.setDate(renewalWindow.getDate() + 120);
  const expiringWindow = new Date(today);
  expiringWindow.setDate(expiringWindow.getDate() + 30);
  const activeContracts = contracts.filter((contract) => contract.status === "Active");
  const renewalContracts = activeContracts.filter((contract) => new Date(`${contract.endDate}T00:00:00.000Z`) <= renewalWindow);
  const expiringContracts = activeContracts.filter((contract) => new Date(`${contract.endDate}T00:00:00.000Z`) <= expiringWindow);
  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">계약</h1>
        <p className="text-sm text-muted-foreground">임대 조건, 갱신 일정, 계약 유효성을 확인합니다</p>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader><CardTitle>유효 계약</CardTitle></CardHeader>
          <CardContent className="text-3xl font-bold">{activeContracts.length}</CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle>갱신 검토</CardTitle></CardHeader>
          <CardContent className="text-3xl font-bold">{renewalContracts.length}</CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle>만료 임박</CardTitle></CardHeader>
          <CardContent className="text-3xl font-bold">{expiringContracts.length}</CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>계약 일정</CardTitle>
        </CardHeader>
        <CardContent className="px-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="pl-6">임차인</TableHead>
                <TableHead>세대</TableHead>
                <TableHead>월 임대료</TableHead>
                <TableHead>만료일</TableHead>
                <TableHead>상태</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {contracts.map((contract) => {
                const expiryDate = new Date(`${contract.endDate}T00:00:00.000Z`);
                const expiringSoon = contract.status === "Active" && expiryDate <= expiringWindow;
                const renewal = contract.status === "Active" && expiryDate <= renewalWindow;
                const displayStatus = expiringSoon ? "만료 임박" : renewal ? "갱신 검토" : contract.status === "Active" ? "유효" : contract.status;
                return (
                <TableRow key={contract.id}>
                  <TableCell className="pl-6 font-medium">{tenantNames.get(contract.tenantId) ?? "Unassigned tenant"}</TableCell>
                  <TableCell>{contract.unit}</TableCell>
                  <TableCell>{contract.monthlyRent}</TableCell>
                  <TableCell>{contract.endDate}</TableCell>
                  <TableCell>
                    <Badge
                      variant="outline"
                      className={
                        displayStatus === "유효"
                          ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300"
                          : displayStatus === "갱신 검토" || displayStatus === "만료 임박"
                            ? "border-amber-500/30 bg-amber-500/10 text-amber-700 dark:text-amber-300"
                            : "border-red-500/30 bg-red-500/10 text-red-700 dark:text-red-300"
                      }
                    >
                      {displayStatus}
                    </Badge>
                  </TableCell>
                </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
