"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { PlusIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { FieldError, FormField } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { NativeSelect, NativeSelectOption } from "@/components/ui/native-select";
import { recordReceipt, BillingMutationError } from "@/lib/billing-client-mutation";
import type { MonthlyCharge } from "@/lib/billing";

const methods = ["BankTransfer", "Cash", "Card", "Other"] as const;

function today(): string { return new Date().toISOString().slice(0, 10); }
function formatWon(value: number): string { return `₩${value.toLocaleString("ko-KR")}`; }

export function ReceiptManager({ charges }: { charges: MonthlyCharge[] }) {
  const router = useRouter();
  const eligible = charges.filter((charge) => (charge.status === "Approved" || charge.status === "PartiallyPaid") && charge.outstandingWon > 0);
  const [open, setOpen] = useState(false);
  const [chargeId, setChargeId] = useState("");
  const [amountWon, setAmountWon] = useState("");
  const [receivedDate, setReceivedDate] = useState(today());
  const [method, setMethod] = useState<(typeof methods)[number]>("BankTransfer");
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const selected = eligible.find((charge) => charge.id === chargeId);

  function openDialog() { setChargeId(eligible[0]?.id ?? ""); setAmountWon(""); setReceivedDate(today()); setMethod("BankTransfer"); setError(null); setOpen(true); }
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const amount = Number(amountWon);
    if (!selected || !Number.isSafeInteger(amount) || amount <= 0 || amount > selected.outstandingWon) { setError("수납 금액은 선택한 청구의 미수금 범위에서 입력해 주세요."); return; }
    setSaving(true); setError(null);
    try {
      await recordReceipt({ propertyId: selected.propertyId, tenantId: selected.tenantId, receivedDate, amountWon: amount, method, allocations: [{ chargeId: selected.id, amountWon: amount }] });
      setOpen(false); router.refresh();
    } catch (cause) {
      setError(cause instanceof BillingMutationError && cause.status === 401 ? "로그인이 만료되었습니다. 다시 로그인해 주세요." : cause instanceof BillingMutationError && cause.status === 403 ? "수납 등록 권한이 없습니다." : "수납 등록에 실패했습니다. 다시 시도해 주세요.");
    } finally { setSaving(false); }
  }

  return <><Button onClick={openDialog} disabled={eligible.length === 0}><PlusIcon data-icon="inline-start" />수납 등록</Button>
    <Dialog open={open} onOpenChange={setOpen}><DialogContent className="sm:max-w-lg"><DialogHeader><DialogTitle>수납 등록</DialogTitle><DialogDescription>수납 금액은 선택한 청구의 미수금에 배분됩니다.</DialogDescription></DialogHeader>
      <form className="space-y-5" onSubmit={submit}>
        <FormField label="청구 건" htmlFor="receipt-charge"><NativeSelect id="receipt-charge" value={chargeId} onChange={(event) => setChargeId(event.target.value)}>{eligible.map((charge) => <NativeSelectOption key={charge.id} value={charge.id}>{charge.billingMonth} · {charge.dueDate} · 미수 {formatWon(charge.outstandingWon)}</NativeSelectOption>)}</NativeSelect></FormField>
        <div className="grid gap-4 sm:grid-cols-2"><FormField label="수납일" htmlFor="receipt-date"><Input id="receipt-date" type="date" value={receivedDate} onChange={(event) => setReceivedDate(event.target.value)} required /></FormField><FormField label="수납 방법" htmlFor="receipt-method"><NativeSelect id="receipt-method" value={method} onChange={(event) => setMethod(event.target.value as typeof method)}>{methods.map((item) => <NativeSelectOption key={item} value={item}>{item}</NativeSelectOption>)}</NativeSelect></FormField></div>
        <FormField label="수납 금액" htmlFor="receipt-amount" description={selected ? `현재 미수금 ${formatWon(selected.outstandingWon)}` : undefined}><Input id="receipt-amount" type="number" min="1" max={selected?.outstandingWon} value={amountWon} onChange={(event) => setAmountWon(event.target.value)} required /></FormField>
        <FieldError>{error}</FieldError><DialogFooter><Button type="button" variant="outline" onClick={() => setOpen(false)} disabled={saving}>취소</Button><Button type="submit" disabled={saving || !selected}>{saving ? "등록 중..." : "수납 저장"}</Button></DialogFooter>
      </form>
    </DialogContent></Dialog></>;
}
