import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getProperties } from "@/lib/properties";
import { getTenants } from "@/lib/tenants";
import { TenantManager } from "./tenant-manager";

export const dynamic = "force-dynamic";
export default async function TenantsPage() {
  const [tenants, properties] = await Promise.all([
    getTenants(),
    getProperties(),
  ]);
  const paid = tenants.filter((tenant) => tenant.status === "Paid").length;
  const overdue = tenants.filter(
    (tenant) => tenant.status === "Overdue",
  ).length;
  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">임차인</h1>
        <p className="text-sm text-muted-foreground">
          임차인과 납부 상태를 관리합니다.
        </p>
      </div>
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle>전체 임차인</CardTitle>
          </CardHeader>
          <CardContent className="text-3xl font-bold">
            {tenants.length}
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>납부 완료</CardTitle>
          </CardHeader>
          <CardContent className="text-3xl font-bold">{paid}</CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>연체</CardTitle>
          </CardHeader>
          <CardContent className="text-3xl font-bold">{overdue}</CardContent>
        </Card>
      </div>
      <Card>
        <CardContent className="p-0">
          <TenantManager tenants={tenants} properties={properties} />
        </CardContent>
      </Card>
    </div>
  );
}
