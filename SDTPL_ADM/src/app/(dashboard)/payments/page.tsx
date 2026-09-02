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

const payments = [
  { property: "Seoul Heights", amount: "₩12,400,000", due: "2026-09-05", status: "Paid" },
  { property: "Hana Village", amount: "₩9,800,000", due: "2026-09-05", status: "Overdue" },
  { property: "Blue Park", amount: "₩8,200,000", due: "2026-09-10", status: "Pending" },
  { property: "Riverside Point", amount: "₩15,300,000", due: "2026-09-11", status: "Paid" },
];

export default function PaymentsPage() {
  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Payments</h1>
        <p className="text-sm text-muted-foreground">Rent collection and overdue monitoring</p>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader><CardTitle>Collected</CardTitle></CardHeader>
          <CardContent className="text-3xl font-bold">₩128M</CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle>Pending</CardTitle></CardHeader>
          <CardContent className="text-3xl font-bold">₩18M</CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle>Overdue</CardTitle></CardHeader>
          <CardContent className="text-3xl font-bold">₩6.4M</CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Collection Status</CardTitle>
        </CardHeader>
        <CardContent className="px-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="pl-6">Property</TableHead>
                <TableHead>Amount</TableHead>
                <TableHead>Due Date</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {payments.map((payment) => (
                <TableRow key={payment.property}>
                  <TableCell className="pl-6 font-medium">{payment.property}</TableCell>
                  <TableCell>{payment.amount}</TableCell>
                  <TableCell>{payment.due}</TableCell>
                  <TableCell>
                    <Badge
                      variant="outline"
                      className={
                        payment.status === "Paid"
                          ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300"
                          : payment.status === "Overdue"
                            ? "border-red-500/30 bg-red-500/10 text-red-700 dark:text-red-300"
                            : "border-amber-500/30 bg-amber-500/10 text-amber-700 dark:text-amber-300"
                      }
                    >
                      {payment.status}
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
