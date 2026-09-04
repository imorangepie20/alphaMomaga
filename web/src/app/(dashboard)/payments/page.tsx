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
import { getPayments } from "@/lib/payments";
import { getProperties } from "@/lib/properties";

export const dynamic = "force-dynamic";

export default async function PaymentsPage() {
  const [payments, properties] = await Promise.all([getPayments(), getProperties()]);
  const propertyNames = new Map(properties.map((property) => [property.id, property.name]));
  const amount = (value: string) => Number.parseInt(value.replace(/[^0-9]/g, ""), 10);
  const paidAmount = payments.filter((payment) => payment.status === "Paid").reduce((total, payment) => total + amount(payment.amount), 0);
  const pendingAmount = payments.filter((payment) => payment.status === "Pending").reduce((total, payment) => total + amount(payment.amount), 0);
  const overdueAmount = payments.filter((payment) => payment.status === "Overdue").reduce((total, payment) => total + amount(payment.amount), 0);
  const formatMillion = (value: number) => `₩${(value / 1000000).toFixed(1)}M`;
  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">수납</h1>
        <p className="text-sm text-muted-foreground">임대료 수납과 연체 현황을 관리합니다</p>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader><CardTitle>수납 완료</CardTitle></CardHeader>
          <CardContent className="text-3xl font-bold">{formatMillion(paidAmount)}</CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle>수납 예정</CardTitle></CardHeader>
          <CardContent className="text-3xl font-bold">{formatMillion(pendingAmount)}</CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle>연체 금액</CardTitle></CardHeader>
          <CardContent className="text-3xl font-bold">{formatMillion(overdueAmount)}</CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>수납 현황</CardTitle>
        </CardHeader>
        <CardContent className="px-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="pl-6">자산명</TableHead>
                <TableHead>금액</TableHead>
                <TableHead>납부 예정일</TableHead>
                <TableHead>상태</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {payments.map((payment) => (
                <TableRow key={payment.id}>
                  <TableCell className="pl-6 font-medium">{propertyNames.get(payment.propertyId) ?? "연결되지 않은 자산"}</TableCell>
                  <TableCell>{payment.amount}</TableCell>
                  <TableCell>{payment.dueDate}</TableCell>
                  <TableCell>
                    <Badge
                      variant="outline"
                      className={
                        payment.status === "Paid"
                          ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-700"
                          : payment.status === "Overdue"
                            ? "border-red-500/30 bg-red-500/10 text-red-700"
                            : "border-amber-500/30 bg-amber-500/10 text-amber-700"
                      }
                    >
                      {payment.status === "Paid" ? "납부 완료" : payment.status === "Overdue" ? "연체" : "납부 예정"}
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
