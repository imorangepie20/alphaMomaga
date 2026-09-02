import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const users = [
  { name: "Alicia Park", role: "Admin", status: "Active" },
  { name: "David Han", role: "Property Manager", status: "Active" },
  { name: "Mina Lee", role: "Finance", status: "Pending" },
  { name: "Chris Kim", role: "Inspector", status: "Active" },
];

export default function AdminUsersPage() {
  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Users</h1>
        <p className="text-sm text-muted-foreground">Account access and operational permissions</p>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Staff Accounts</CardTitle>
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
