import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const portfolio = [
  { label: "Residential", value: "78" },
  { label: "Commercial", value: "34" },
  { label: "Mixed-use", value: "18" },
  { label: "Vacant Units", value: "14" },
];

export default function PortfolioPage() {
  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Portfolio</h1>
        <p className="text-sm text-muted-foreground">Asset mix and operational distribution</p>
      </div>
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {portfolio.map((item) => (
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
