"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useHydrated } from "@/hooks/use-hydrated";
import { AlertDialog, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { voidReceipt, BillingMutationError } from "@/lib/billing-client-mutation";
import type { MonthlyCharge, PaymentReceipt } from "@/lib/billing";

export function ReceiptHistory({ receipts, charges }: { receipts: PaymentReceipt[]; charges: MonthlyCharge[] }) {
  const hydrated = useHydrated();
  const router = useRouter(); const [reason, setReason] = useState<Record<string, string>>({}); const [pending, setPending] = useState<string | null>(null); const [error, setError] = useState<string | null>(null);
  const [confirmation, setConfirmation] = useState<{ receipt: PaymentReceipt; reason: string } | null>(null);
  function requestVoid(receipt: PaymentReceipt) {
    const value = reason[receipt.id]?.trim();
    if (!value) { setError("영수증 취소 사유를 입력해 주세요."); return; }
    setError(null);
    setConfirmation({ receipt, reason: value });
  }
  async function confirmVoid() {
    if (!confirmation || pending) return;
    setPending(confirmation.receipt.id);
    setError(null);
    try {
      await voidReceipt(confirmation.receipt.id, confirmation.reason);
      setConfirmation(null);
      router.refresh();
    } catch (cause) {
      setError(cause instanceof BillingMutationError && cause.status === 401
        ? "로그인이 만료되었습니다. 다시 로그인해 주세요."
        : cause instanceof BillingMutationError && cause.status === 403
          ? "영수증 취소 권한이 없습니다." : "영수증 취소에 실패했습니다. 원장을 확인한 뒤 다시 시도해 주세요.");
    } finally { setPending(null); }
  }
  return <><div className="space-y-3"><h3 className="text-base font-semibold">수납 이력</h3>{error && !confirmation && <p role="alert" className="text-sm text-destructive">{error}</p>}{receipts.length === 0 ? <p className="text-sm text-muted-foreground">등록된 수납 영수증이 없습니다.</p> : receipts.map((receipt) => <div key={receipt.id} className="rounded-lg border p-3 text-sm"><div className="flex flex-wrap items-center justify-between gap-2"><span>{receipt.receivedDate} · ₩{receipt.amountWon.toLocaleString("ko-KR")} · {receipt.method}</span><span className={receipt.voidedAt ? "text-destructive" : "text-emerald-700"}>{receipt.voidedAt ? `취소됨: ${receipt.voidReason}` : "정상"}</span></div><p className="mt-2 text-muted-foreground">배분: {receipt.allocations.map((allocation) => { const charge = charges.find((item) => item.id === allocation.chargeId); return `${charge ? `${charge.billingMonth} ${charge.dueDate}` : allocation.chargeId} ${allocation.amountWon.toLocaleString("ko-KR")}원`; }).join(", ")}</p>{(receipt.reference || receipt.memo) && <p className="mt-1 text-muted-foreground">{receipt.reference && `참조 ${receipt.reference}`}{receipt.reference && receipt.memo && " · "}{receipt.memo}</p>}{!receipt.voidedAt && <div className="mt-3 flex gap-2"><Input disabled={!hydrated} aria-label={`${receipt.id} 취소 사유`} placeholder="취소 사유" value={reason[receipt.id] ?? ""} onChange={(event) => setReason({ ...reason, [receipt.id]: event.target.value })} /><Button size="sm" variant="outline" onClick={() => requestVoid(receipt)} disabled={!hydrated || pending !== null}>{pending === receipt.id ? "처리 중..." : "영수증 취소"}</Button></div>}</div>)}</div>
    <AlertDialog open={confirmation !== null} onOpenChange={(open) => { if (!open && !pending) { setConfirmation(null); setError(null); } }}>
      <AlertDialogContent>
        <AlertDialogHeader><AlertDialogTitle>영수증 취소 확인</AlertDialogTitle><AlertDialogDescription>수납을 취소하면 배분 금액만큼 미수금이 복구됩니다. 원본 영수증과 취소 기록은 보존됩니다.</AlertDialogDescription></AlertDialogHeader>
        {confirmation && <dl className="space-y-2 break-all text-sm"><div><dt className="text-muted-foreground">영수증 번호</dt><dd>{confirmation.receipt.id}</dd></div><div><dt className="text-muted-foreground">취소 금액</dt><dd>₩{confirmation.receipt.amountWon.toLocaleString("ko-KR")}</dd></div><div><dt className="text-muted-foreground">취소 사유</dt><dd>{confirmation.reason}</dd></div></dl>}
        {error && <p role="alert" className="text-sm text-destructive">{error}</p>}
        <AlertDialogFooter><Button variant="outline" disabled={pending !== null} onClick={() => { setConfirmation(null); setError(null); }}>돌아가기</Button><Button variant="destructive" disabled={pending !== null} onClick={confirmVoid}>{pending ? "처리 중..." : "취소 확정"}</Button></AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  </>;
}
