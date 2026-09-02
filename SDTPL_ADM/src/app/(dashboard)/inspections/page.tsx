import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const inspections = [
  { name: "Seoul Heights", type: "Safety", due: "2026-09-06", status: "Scheduled" },
  { name: "Hana Village", type: "HVAC", due: "2026-09-09", status: "Completed" },
  { name: "Riverside Point", type: "Fire Safety", due: "2026-09-12", status: "In Review" },
  { name: "Blue Park", type: "Facade", due: "2026-09-18", status: "Pending" },
];

export default function InspectionsPage() {
  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Inspections</h1>
        <p className="text-sm text-muted-foreground">Safety checks and compliance review</p>
      </div>
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <Card>
          <CardHeader><CardTitle>Scheduled</CardTitle></CardHeader>
          <CardContent className="text-3xl font-bold">12</CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle>Completed</CardTitle></CardHeader>
          <CardContent className="text-3xl font-bold">46</CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle>Needs Review</CardTitle></CardHeader>
          <CardContent className="text-3xl font-bold">4</CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle>Critical</CardTitle></CardHeader>
          <CardContent className="text-3xl font-bold">1</CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Inspection Schedule</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {inspections.map((item) => (
            <div key={item.name} className="flex items-center justify-between rounded-lg border p-3">
              <div>
                <div className="font-medium">{item.name}</div>
                <div className="text-sm text-muted-foreground">{item.type}</div>
              </div>
              <div className="text-sm text-muted-foreground">{item.due}</div>
              <div className="text-sm font-medium">{item.status}</div>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
