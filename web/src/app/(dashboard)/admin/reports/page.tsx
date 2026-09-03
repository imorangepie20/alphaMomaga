import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const stats = [
  { label: "Occupancy Rate", value: "91.4%" },
  { label: "Outstanding Rent", value: "₩6.4M" },
  { label: "Avg. Response Time", value: "2.3 days" },
  { label: "Maintenance SLA", value: "94%" },
];

export default function AdminReportsPage() {
  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Reports</h1>
        <p className="text-sm text-muted-foreground">Manager performance snapshot for quarterly review</p>
      </div>
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {stats.map((item) => (
          <Card key={item.label}>
            <CardHeader>
              <CardTitle>{item.label}</CardTitle>
            </CardHeader>
            <CardContent className="text-3xl font-bold">{item.value}</CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
