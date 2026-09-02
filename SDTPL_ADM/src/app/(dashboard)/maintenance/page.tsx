import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";

const maintenance = [
  { property: "Seoul Heights", task: "Elevator inspection", due: "2026-09-07", status: "Scheduled" },
  { property: "Hana Village", task: "Water leak repair", due: "2026-09-09", status: "In Progress" },
  { property: "Riverside Point", task: "HVAC maintenance", due: "2026-09-14", status: "Completed" },
  { property: "Blue Park", task: "Facade check", due: "2026-09-22", status: "Pending" },
];

export default function MaintenancePage() {
  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Maintenance</h1>
        <p className="text-sm text-muted-foreground">Inspection workload and repair queue</p>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader><CardTitle>Open Tasks</CardTitle></CardHeader>
          <CardContent className="text-3xl font-bold">31</CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle>In Progress</CardTitle></CardHeader>
          <CardContent className="text-3xl font-bold">8</CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle>Completed</CardTitle></CardHeader>
          <CardContent className="text-3xl font-bold">64</CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Work Orders</CardTitle>
        </CardHeader>
        <CardContent className="px-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="pl-6">Property</TableHead>
                <TableHead>Task</TableHead>
                <TableHead>Due</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {maintenance.map((item) => (
                <TableRow key={item.task}>
                  <TableCell className="pl-6 font-medium">{item.property}</TableCell>
                  <TableCell>{item.task}</TableCell>
                  <TableCell>{item.due}</TableCell>
                  <TableCell>
                    <Badge
                      variant="outline"
                      className={
                        item.status === "Completed"
                          ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300"
                          : item.status === "In Progress"
                            ? "border-blue-500/30 bg-blue-500/10 text-blue-700 dark:text-blue-300"
                            : item.status === "Scheduled"
                              ? "border-amber-500/30 bg-amber-500/10 text-amber-700 dark:text-amber-300"
                              : "border-slate-500/30 bg-slate-500/10 text-slate-700 dark:text-slate-300"
                      }
                    >
                      {item.status}
                    </Badge>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
