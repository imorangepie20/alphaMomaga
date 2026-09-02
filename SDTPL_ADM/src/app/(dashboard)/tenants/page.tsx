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

const tenants = [
  { name: "Kim Jihoon", unit: "A-101", rent: "₩1,200,000", status: "Paid" },
  { name: "Park Minseo", unit: "B-302", rent: "₩980,000", status: "Overdue" },
  { name: "Lee Daeho", unit: "C-205", rent: "₩1,540,000", status: "Paid" },
  { name: "Choi Yuna", unit: "D-408", rent: "₩1,020,000", status: "Pending" },
];

export default function TenantsPage() {
  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Tenants</h1>
        <p className="text-sm text-muted-foreground">Occupancy, contracts, and payment status</p>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader><CardTitle>Total Tenants</CardTitle></CardHeader>
          <CardContent className="text-3xl font-bold">286</CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle>Paid This Month</CardTitle></CardHeader>
          <CardContent className="text-3xl font-bold">241</CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle>Overdue</CardTitle></CardHeader>
          <CardContent className="text-3xl font-bold">18</CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Tenant Records</CardTitle>
        </CardHeader>
        <CardContent className="px-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="pl-6">Tenant</TableHead>
                <TableHead>Unit</TableHead>
                <TableHead>Monthly Rent</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {tenants.map((tenant) => (
                <TableRow key={tenant.name}>
                  <TableCell className="pl-6 font-medium">{tenant.name}</TableCell>
                  <TableCell>{tenant.unit}</TableCell>
                  <TableCell>{tenant.rent}</TableCell>
                  <TableCell>
                    <Badge
                      variant="outline"
                      className={
                        tenant.status === "Paid"
                          ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300"
                          : tenant.status === "Overdue"
                            ? "border-red-500/30 bg-red-500/10 text-red-700 dark:text-red-300"
                            : "border-amber-500/30 bg-amber-500/10 text-amber-700 dark:text-amber-300"
                      }
                    >
                      {tenant.status}
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
