"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { PencilIcon, PlusIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { FieldError, FormField } from "@/components/ui/field";
import { NativeSelect, NativeSelectOption } from "@/components/ui/native-select";
import { saveTenant, type TenantMutationInput } from "@/lib/tenant-mutation";
import type { MonthlyCharge } from "@/lib/billing";
import type { Property } from "@/lib/properties";
import type { Tenant } from "@/lib/tenants";

const emptyForm: TenantMutationInput = { name: "", propertyId: "", unit: "", rent: 0 };

function formatWon(amount: number) {
  return `₩${amount.toLocaleString("ko-KR")}`;
}

function chargeStatusText(charge?: MonthlyCharge) {
  if (!charge) return "청구 없음";
  return ({ Draft: "승인 대기", Approved: "청구됨", PartiallyPaid: "부분 납부", Paid: "납부 완료", Overdue: "연체", Cancelled: "취소됨" } as const)[charge.status];
}

export function TenantManager({ tenants, properties, charges, billingMonth }: { tenants: Tenant[]; properties: Property[]; charges: MonthlyCharge[]; billingMonth: string }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [selected, setSelected] = useState<Tenant | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const chargeByTenantId = new Map(charges.map((charge) => [charge.tenantId, charge]));

  function start(tenant?: Tenant) {
    setSelected(tenant ?? null);
    setForm(tenant ? { name: tenant.name, propertyId: tenant.propertyId, unit: tenant.unit, rent: Number(tenant.rent.replace(/[^0-9]/g, "")) } : emptyForm);
    setError("");
    setOpen(true);
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const input = { ...form, name: form.name.trim(), unit: form.unit.trim() };
    if (!input.name || !input.propertyId || !input.unit || input.rent <= 0) { setError("이름, 속성, 호실, 월 임대료를 입력해 주세요."); return; }
    setSaving(true);
    setError("");
    try { await saveTenant(input, selected?.id); setOpen(false); router.refresh(); }
    catch (cause) {
      const status = cause instanceof Error ? cause.message : "";
      setError(status === "401" ? "로그인이 만료되었습니다. 다시 로그인해 주세요." : status === "403" ? "현재 계정에는 임차인 관리 권한이 없습니다." : "저장하지 못했습니다. 같은 속성의 호실 중복 여부를 확인해 주세요.");
    } finally { setSaving(false); }
  }

  return <>
    <div className="flex flex-wrap items-center justify-between gap-3 px-6 pt-5"><p className="text-sm text-muted-foreground">{billingMonth} 청구월 기준입니다. 수납 상태는 수납 원장에서 계산됩니다.</p><Button onClick={() => start()}><PlusIcon data-icon="inline-start" />임차인 추가</Button></div>
    <div className="overflow-x-auto"><table className="w-full min-w-[980px] text-sm"><thead><tr className="border-b text-left text-muted-foreground"><th className="p-4 pl-6">임차인</th><th className="p-4">호실</th><th className="p-4">월 임대료</th><th className="p-4">청구</th><th className="p-4">납부</th><th className="p-4">미수</th><th className="p-4">상태</th><th className="p-4 pr-6 text-right">관리</th></tr></thead>
      <tbody>{tenants.map((tenant) => {
        const charge = chargeByTenantId.get(tenant.id);
        return <tr key={tenant.id} className="border-b"><td className="p-4 pl-6 font-medium">{tenant.name}</td><td className="p-4">{tenant.unit}</td><td className="p-4">{tenant.rent}</td><td className="p-4">{charge ? formatWon(charge.billedWon) : "-"}</td><td className="p-4">{charge ? formatWon(charge.receivedWon) : "-"}</td><td className="p-4">{charge ? formatWon(charge.outstandingWon) : "-"}</td><td className="p-4"><span className={charge?.status === "Overdue" ? "font-medium text-destructive" : "text-muted-foreground"}>{chargeStatusText(charge)}</span></td><td className="p-4 pr-6 text-right"><Button variant="ghost" size="sm" onClick={() => start(tenant)}><PencilIcon data-icon="inline-start" />수정</Button></td></tr>;
      })}</tbody></table></div>
    <Dialog open={open} onOpenChange={setOpen}><DialogContent><DialogHeader><DialogTitle>{selected ? "임차인 수정" : "임차인 추가"}</DialogTitle><DialogDescription>임차인 기본 정보만 관리합니다. 납부 상태는 월별 청구와 영수증에서 계산됩니다.</DialogDescription></DialogHeader>
      <form className="space-y-4" onSubmit={submit}>
        <FormField label="이름" htmlFor="tenant-name"><Input id="tenant-name" value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} /></FormField>
        <FormField label="속성" htmlFor="tenant-property"><NativeSelect id="tenant-property" disabled={!!selected} className="w-full" value={form.propertyId} onChange={(event) => setForm({ ...form, propertyId: event.target.value })}><NativeSelectOption value="">속성 선택</NativeSelectOption>{properties.map((property) => <NativeSelectOption key={property.id} value={property.id}>{property.name}</NativeSelectOption>)}</NativeSelect></FormField>
        <FormField label="호실" htmlFor="tenant-unit"><Input id="tenant-unit" value={form.unit} onChange={(event) => setForm({ ...form, unit: event.target.value })} /></FormField>
        <FormField label="월 임대료" htmlFor="tenant-rent"><Input id="tenant-rent" type="number" min="1" value={form.rent} onChange={(event) => setForm({ ...form, rent: Number(event.target.value) })} /></FormField>
        <FieldError>{error}</FieldError><DialogFooter><Button type="button" variant="outline" onClick={() => setOpen(false)} disabled={saving}>취소</Button><Button type="submit" disabled={saving}>{saving ? "저장 중..." : "저장"}</Button></DialogFooter>
      </form>
    </DialogContent></Dialog>
  </>;
}
