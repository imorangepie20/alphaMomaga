"use client";

import { useRouter } from "next/navigation";
import { Input } from "@/components/ui/input";

export function BillingMonthSelector({ billingMonth }: { billingMonth: string }) {
  const router = useRouter();
  return <label className="flex items-center gap-2 text-sm text-muted-foreground"><span>청구월</span><Input aria-label="청구월" className="h-9 w-36" type="month" value={billingMonth} onChange={(event) => { if (event.target.value) router.push(`/payments?billingMonth=${event.target.value}`); }} /></label>;
}
