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

const contracts = [
  { tenant: "Kim Jihoon", unit: "A-101", rent: "₩1,200,000", expiry: "2027-08-31", status: "Active" },
  { tenant: "Park Minseo", unit: "B-302", rent: "₩980,000", expiry: "2026-12-15", status: "Renewal Review" },
  { tenant: "Lee Daeho", unit: "C-205", rent: "₩1,540,000", expiry: "2027-03-09", status: "Active" },
  { tenant: "Choi Yuna", unit: "D-408", rent: "₩1,020,000", expiry: "2026-10-02", status: "Expiring Soon" },
];

export default function ContractsPage() {
  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Contracts</h1>
        <p className="text-sm text-muted-foreground">Lease terms, renewals, and legal validity</p>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader><CardTitle>Active</CardTitle></CardHeader>
          <CardContent className="text-3xl font-bold">241</CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle>Renewal Review</CardTitle></CardHeader>
          <CardContent className="text-3xl font-bold">18</CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle>Expiring Soon</CardTitle></CardHeader>
          <CardContent className="text-3xl font-bold">9</CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Lease Schedule</CardTitle>
        </CardHeader>
        <CardContent className="px-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="pl-6">Tenant</TableHead>
                <TableHead>Unit</TableHead>
                <TableHead>Monthly Rent</TableHead>
                <TableHead>Expiry</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {contracts.map((contract) => (
                <TableRow key={contract.tenant}>
                  <TableCell className="pl-6 font-medium">{contract.tenant}</TableCell>
                  <TableCell>{contract.unit}</TableCell>
                  <TableCell>{contract.rent}</TableCell>
                  <TableCell>{contract.expiry}</TableCell>
                  <TableCell>
                    <Badge
                      variant="outline"
                      className={
                        contract.status === "Active"
                          ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300"
                          : contract.status === "Renewal Review"
                            ? "border-amber-500/30 bg-amber-500/10 text-amber-700 dark:text-amber-300"
                            : "border-red-500/30 bg-red-500/10 text-red-700 dark:text-red-300"
                      }
                    >
                      {contract.status}
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
