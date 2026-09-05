import { Button } from "./ui/button";
import { Input } from "./ui/input";

export function InvalidBillingMonth({ title, action }: { title: string; action: string }) {
  return <div className="space-y-4">
    <h1 className="text-2xl font-semibold">{title}</h1>
    <p role="alert" className="text-sm text-destructive">올바른 청구월(YYYY-MM)을 선택해 주세요. 다른 월의 금액으로 대체하지 않았습니다.</p>
    <form action={action} className="flex flex-wrap items-end gap-3">
      <div className="space-y-2"><label htmlFor="corrected-billing-month" className="text-sm">청구월</label><Input id="corrected-billing-month" name="billingMonth" type="month" required min="1000-01" max="9999-12" /></div>
      <Button type="submit" variant="outline">조회</Button>
    </form>
  </div>;
}
