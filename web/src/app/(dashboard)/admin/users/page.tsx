import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const users = [
  { name: "Alicia Park", role: "시스템 관리자", status: "활성" },
  { name: "David Han", role: "부동산 매니저", status: "활성" },
  { name: "Mina Lee", role: "재무 담당자", status: "승인 대기" },
  { name: "Chris Kim", role: "점검 담당자", status: "활성" },
];

export default function AdminUsersPage() {
  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">사용자</h1>
        <p className="text-sm text-muted-foreground">계정 접근과 운영 권한을 관리합니다</p>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>직원 계정</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {users.map((user) => (
            <div key={user.name} className="flex items-center justify-between rounded-lg border p-3">
              <div>
                <div className="font-medium">{user.name}</div>
                <div className="text-sm text-muted-foreground">{user.role}</div>
              </div>
              <div className="text-sm font-medium">{user.status}</div>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
