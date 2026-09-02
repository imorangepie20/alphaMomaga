import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const occupancy = [
  { label: "Average Occupancy", value: "91.4%" },
  { label: "New Leases", value: "24" },
  { label: "Move-outs", value: "7" },
  { label: "Renewals", value: "16" },
];

export default function OccupancyPage() {
  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Occupancy</h1>
        <p className="text-sm text-muted-foreground">Occupancy trends and tenant turnover</p>
      </div>
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {occupancy.map((item) => (
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
