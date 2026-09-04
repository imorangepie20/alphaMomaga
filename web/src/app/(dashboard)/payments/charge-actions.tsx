"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { FieldError, FormField } from "@/components/ui/field";
import { approveCharge, cancelCharge, BillingMutationError } from "@/lib/billing-client-mutation";
import type { MonthlyCharge } from "@/lib/billing";

export function ChargeActions({ charge }: { charge: MonthlyCharge }) {
  const router = useRouter();
  const [open, setOpen] = useState(false); const [reason, setReason] = useState(""); const [error, setError] = useState<string | null>(null); const [pending, setPending] = useState(false);
  async function approve() { setPending(true); try { await approveCharge(charge.id); router.refresh(); } finally { setPending(false); } }
  async function cancel() { if (!reason.trim()) { setError("취소 사유를 입력해 주세요."); return; } setPending(true); setError(null); try { await cancelCharge(charge.id, reason); setOpen(false); router.refresh(); } catch (cause) { setError(cause instanceof BillingMutationError && cause.status === 403 ? "청구 취소 권한이 없습니다." : "청구 취소에 실패했습니다."); } finally { setPending(false); } }
  if (charge.status === "Draft") return <Button size="sm" variant="outline" onClick={approve} disabled={pending}>{pending ? "확정 중..." : "청구 확정"}</Button>;
  if (charge.status !== "Approved" || charge.receivedWon !== 0) return null;
  return <><Button size="sm" variant="ghost" onClick={() => { setReason(""); setError(null); setOpen(true); }}>청구 취소</Button><Dialog open={open} onOpenChange={setOpen}><DialogContent><DialogHeader><DialogTitle>청구 취소</DialogTitle><DialogDescription>수납이 없는 청구만 취소할 수 있으며 기록은 보존됩니다.</DialogDescription></DialogHeader><FormField label="취소 사유" htmlFor={`cancel-${charge.id}`}><Input id={`cancel-${charge.id}`} value={reason} onChange={(event) => setReason(event.target.value)} required /></FormField><FieldError>{error}</FieldError><DialogFooter><Button variant="outline" onClick={() => setOpen(false)} disabled={pending}>닫기</Button><Button onClick={cancel} disabled={pending}>{pending ? "취소 중..." : "청구 취소"}</Button></DialogFooter></DialogContent></Dialog></>;
}
