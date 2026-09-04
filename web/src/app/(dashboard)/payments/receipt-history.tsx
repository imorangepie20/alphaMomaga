"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { voidReceipt, BillingMutationError } from "@/lib/billing-client-mutation";
import type { PaymentReceipt } from "@/lib/billing";

export function ReceiptHistory({ receipts }: { receipts: PaymentReceipt[] }) {
  const router = useRouter(); const [reason, setReason] = useState<Record<string, string>>({}); const [pending, setPending] = useState<string | null>(null); const [error, setError] = useState<string | null>(null);
  async function voidItem(receipt: PaymentReceipt) { const value = reason[receipt.id]?.trim(); if (!value) { setError("영수증 취소 사유를 입력해 주세요."); return; } setPending(receipt.id); setError(null); try { await voidReceipt(receipt.id, value); router.refresh(); } catch (cause) { setError(cause instanceof BillingMutationError && cause.status === 403 ? "영수증 취소 권한이 없습니다." : "영수증 취소에 실패했습니다."); } finally { setPending(null); } }
  return <div className="space-y-3"><h3 className="text-base font-semibold">수납 이력</h3>{error && <p role="alert" className="text-sm text-destructive">{error}</p>}{receipts.length === 0 ? <p className="text-sm text-muted-foreground">등록된 수납 영수증이 없습니다.</p> : receipts.map((receipt) => <div key={receipt.id} className="rounded-lg border p-3 text-sm"><div className="flex flex-wrap items-center justify-between gap-2"><span>{receipt.receivedDate} · ₩{receipt.amountWon.toLocaleString("ko-KR")} · {receipt.method}</span><span className={receipt.voidedAt ? "text-destructive" : "text-emerald-700"}>{receipt.voidedAt ? `취소됨: ${receipt.voidReason}` : "정상"}</span></div>{!receipt.voidedAt && <div className="mt-3 flex gap-2"><Input aria-label={`${receipt.id} 취소 사유`} placeholder="취소 사유" value={reason[receipt.id] ?? ""} onChange={(event) => setReason({ ...reason, [receipt.id]: event.target.value })} /><Button size="sm" variant="outline" onClick={() => voidItem(receipt)} disabled={pending === receipt.id}>{pending === receipt.id ? "처리 중..." : "영수증 취소"}</Button></div>}</div>)}</div>;
}
