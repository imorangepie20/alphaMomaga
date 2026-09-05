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
import { useHydrated } from "@/hooks/use-hydrated";

const methods = ["BankTransfer", "Cash", "Card", "Other"] as const;
const formatWon = (value: number) => `₩${value.toLocaleString("ko-KR")}`;
function today(): string {
  const parts = new Intl.DateTimeFormat("en", {
    timeZone: "Asia/Seoul", year: "numeric", month: "2-digit", day: "2-digit",
  }).formatToParts(new Date());
  return ["year", "month", "day"].map((type) => parts.find((part) => part.type === type)!.value).join("-");
}

export function ReceiptManager({ charges, tenantNames }: { charges: MonthlyCharge[]; tenantNames: Record<string, string> }) {
  const hydrated = useHydrated();
  const router = useRouter();
  const eligible = charges.filter((charge) => (charge.status === "Approved" || charge.status === "PartiallyPaid" || charge.status === "Overdue") && charge.outstandingWon > 0);
  const tenantIds = [...new Set(eligible.map((charge) => charge.tenantId))];
  const [open, setOpen] = useState(false);
  const [tenantId, setTenantId] = useState("");
  const [allocationAmounts, setAllocationAmounts] = useState<Record<string, string>>({});
  const [receivedDate, setReceivedDate] = useState(today());
  const [method, setMethod] = useState<(typeof methods)[number]>("BankTransfer");
  const [reference, setReference] = useState("");
  const [memo, setMemo] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const tenantCharges = eligible.filter((charge) => charge.tenantId === tenantId);
  const amountWon = tenantCharges.reduce((total, charge) => total + (Number(allocationAmounts[charge.id]) || 0), 0);

  function openDialog() { setTenantId(tenantIds[0] ?? ""); setAllocationAmounts({}); setReceivedDate(today()); setMethod("BankTransfer"); setReference(""); setMemo(""); setError(null); setOpen(true); }
  function selectTenant(id: string) { setTenantId(id); setAllocationAmounts({}); }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const allocations = tenantCharges.map((charge) => ({ chargeId: charge.id, amountWon: Number(allocationAmounts[charge.id]) || 0 })).filter((allocation) => allocation.amountWon > 0);
    const invalid = allocations.some((allocation) => !Number.isSafeInteger(allocation.amountWon) || allocation.amountWon > (tenantCharges.find((charge) => charge.id === allocation.chargeId)?.outstandingWon ?? 0));
    const propertyId = tenantCharges[0]?.propertyId;
    if (!tenantId || !propertyId || allocations.length === 0 || invalid || amountWon <= 0) { setError("배분 금액은 각 청구의 미수금 범위에서 하나 이상 입력해 주세요."); return; }
    setSaving(true); setError(null);
    try { await recordReceipt({ propertyId, tenantId, receivedDate, amountWon, method, ...(reference.trim() ? { reference: reference.trim() } : {}), ...(memo.trim() ? { memo: memo.trim() } : {}), allocations }); setOpen(false); router.refresh(); }
    catch (cause) { setError(cause instanceof BillingMutationError && cause.status === 401 ? "로그인이 만료되었습니다. 다시 로그인해 주세요." : cause instanceof BillingMutationError && cause.status === 403 ? "수납 등록 권한이 없습니다." : "수납 등록에 실패했습니다. 다시 시도해 주세요."); }
    finally { setSaving(false); }
  }

  return <><Button onClick={openDialog} disabled={!hydrated || eligible.length === 0}><PlusIcon data-icon="inline-start" />수납 등록</Button>
    <Dialog open={open} onOpenChange={setOpen}><DialogContent className="max-h-[calc(100dvh-2rem)] overflow-y-auto sm:max-w-xl"><DialogHeader><DialogTitle>수납 등록</DialogTitle><DialogDescription>한 임차인의 여러 청구에 실제 입금액을 배분합니다. 영수증 총액은 아래 배분 금액의 합으로 저장됩니다.</DialogDescription></DialogHeader>
      <form className="space-y-5" onSubmit={submit}>
        <FormField label="임차인" htmlFor="receipt-tenant"><NativeSelect id="receipt-tenant" value={tenantId} onChange={(event) => selectTenant(event.target.value)}><NativeSelectOption value="">임차인 선택</NativeSelectOption>{tenantIds.map((id) => <NativeSelectOption key={id} value={id}>{tenantNames[id] ?? id}</NativeSelectOption>)}</NativeSelect></FormField>
        <div className="space-y-2 rounded-lg border p-3"><p className="text-sm font-medium">청구별 배분</p>{tenantCharges.map((charge) => <div key={charge.id} className="grid grid-cols-[1fr_9rem] items-center gap-3 text-sm"><span>{charge.billingMonth} · 납기 {charge.dueDate} · 미수 {formatWon(charge.outstandingWon)}</span><Input aria-label={`${charge.id} 배분 금액`} type="number" min="0" max={charge.outstandingWon} placeholder="0" value={allocationAmounts[charge.id] ?? ""} onChange={(event) => setAllocationAmounts({ ...allocationAmounts, [charge.id]: event.target.value })} /></div>)}</div>
        <p className="text-sm font-medium">영수증 총액: {formatWon(amountWon)}</p>
        <div className="grid gap-4 sm:grid-cols-2"><FormField label="수납일" htmlFor="receipt-date"><Input id="receipt-date" type="date" value={receivedDate} onChange={(event) => setReceivedDate(event.target.value)} required /></FormField><FormField label="수납 방법" htmlFor="receipt-method"><NativeSelect id="receipt-method" value={method} onChange={(event) => setMethod(event.target.value as typeof method)}>{methods.map((item) => <NativeSelectOption key={item} value={item}>{item}</NativeSelectOption>)}</NativeSelect></FormField></div>
        <FormField label="거래 참조번호" htmlFor="receipt-reference" description="은행 거래번호, 카드 승인번호 등"><Input id="receipt-reference" maxLength={160} value={reference} onChange={(event) => setReference(event.target.value)} /></FormField>
        <FormField label="메모" htmlFor="receipt-memo"><Input id="receipt-memo" value={memo} onChange={(event) => setMemo(event.target.value)} /></FormField>
        <FieldError>{error}</FieldError><DialogFooter><Button type="button" variant="outline" onClick={() => setOpen(false)} disabled={saving}>취소</Button><Button type="submit" disabled={saving || !tenantId}>{saving ? "등록 중..." : "수납 저장"}</Button></DialogFooter>
      </form>
    </DialogContent></Dialog></>;
}
