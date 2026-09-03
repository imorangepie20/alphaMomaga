import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getContracts } from "@/lib/contracts";
import { getProperties } from "@/lib/properties";
import { getTenants } from "@/lib/tenants";
import { ContractManager } from "./contract-manager";

export const dynamic = "force-dynamic";

export default async function ContractsPage() {
  const [contracts, tenants, properties] = await Promise.all([
    getContracts(),
    getTenants(),
    getProperties(),
  ]);
  const today = new Date();
  const renewalWindow = new Date(today);
  renewalWindow.setDate(renewalWindow.getDate() + 120);
  const expiringWindow = new Date(today);
  expiringWindow.setDate(expiringWindow.getDate() + 30);
  const activeContracts = contracts.filter(
    (contract) => contract.status === "Active",
  );
  const renewalContracts = activeContracts.filter(
    (contract) =>
      new Date(`${contract.endDate}T00:00:00.000Z`) <= renewalWindow,
  );
  const expiringContracts = activeContracts.filter(
    (contract) =>
      new Date(`${contract.endDate}T00:00:00.000Z`) <= expiringWindow,
  );

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">계약</h1>
        <p className="text-sm text-muted-foreground">
          임차인 계약을 등록하고 계약 상태와 해지일을 관리합니다.
        </p>
      </div>
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle>유효 계약</CardTitle>
          </CardHeader>
          <CardContent className="text-3xl font-bold">
            {activeContracts.length}
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>갱신 검토</CardTitle>
          </CardHeader>
          <CardContent className="text-3xl font-bold">
            {renewalContracts.length}
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>만료 임박</CardTitle>
          </CardHeader>
          <CardContent className="text-3xl font-bold">
            {expiringContracts.length}
          </CardContent>
        </Card>
      </div>
      <Card>
        <CardContent className="p-0">
          <ContractManager
            contracts={contracts}
            tenants={tenants}
            properties={properties}
          />
        </CardContent>
      </Card>
    </div>
  );
}
