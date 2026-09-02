import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const revenue = [
  { label: "Monthly Revenue", value: "₩3.4B" },
  { label: "Collected", value: "₩2.9B" },
  { label: "Pending", value: "₩0.4B" },
  { label: "YoY Growth", value: "12.8%" },
];

export default function RevenuePage() {
  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Revenue</h1>
        <p className="text-sm text-muted-foreground">Collection performance and financial health</p>
      </div>
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {revenue.map((item) => (
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
