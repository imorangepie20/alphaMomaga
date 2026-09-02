import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const roles = [
  { name: "Admin", description: "Full portfolio and user governance" },
  { name: "Property Manager", description: "Monitoring, tenants, maintenance, and payments" },
  { name: "Finance", description: "Reports, collections, and payment reconciliation" },
  { name: "Inspector", description: "Inspection scheduling and compliance review" },
];

export default function AdminRolesPage() {
  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Roles</h1>
        <p className="text-sm text-muted-foreground">Operational authorization matrix</p>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Access Levels</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {roles.map((role) => (
            <div key={role.name} className="flex items-center justify-between rounded-lg border p-3">
              <div>
                <div className="font-medium">{role.name}</div>
                <div className="text-sm text-muted-foreground">{role.description}</div>
              </div>
              <div className="text-sm font-medium">Granted</div>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
