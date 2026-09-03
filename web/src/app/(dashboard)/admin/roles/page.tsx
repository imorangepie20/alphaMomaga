import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getRoles } from "@/lib/roles";

export const dynamic = "force-dynamic";

const roleNames: Record<string, string> = { Admin: "시스템 관리자", PropertyManager: "부동산 매니저", Finance: "재무 담당자", Inspector: "점검 담당자" };
const permissionNames: Record<string, string> = { "portfolio:read": "자산 조회", "tenant:manage": "임차인 관리", "contract:manage": "계약 관리", "payment:manage": "수납 관리", "maintenance:manage": "유지보수 관리", "inspection:manage": "점검 관리", "user:manage": "사용자 관리", "report:read": "보고서 조회" };

export default async function AdminRolesPage() {
  const roles = await getRoles();

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">역할</h1>
        <p className="text-sm text-muted-foreground">운영 권한 체계를 관리합니다</p>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>접근 권한</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {roles.map((role) => (
            <div key={role.name} className="flex items-center justify-between rounded-lg border p-3">
              <div>
                <div className="font-medium">{roleNames[role.name]}</div>
                <div className="text-sm text-muted-foreground">{role.permissions.map((permission) => permissionNames[permission]).join(" · ")}</div>
              </div>
              <div className="text-sm font-medium">권한 부여됨</div>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
