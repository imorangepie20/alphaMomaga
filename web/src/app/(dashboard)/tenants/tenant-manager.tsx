"use client";

import { useRef, useState, type FormEvent } from "react";
import Link from "next/link";
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
import { summarizeTenantCharges, tenantLedgerLabels } from "@/lib/tenant-ledger-summary";

const emptyForm: TenantMutationInput = { name: "", propertyId: "", unit: "", rent: 0 };

function formatWon(amount: number) {
  return `₩${amount.toLocaleString("ko-KR")}`;
}

export function TenantManager({ tenants, properties, charges, billingMonth }: { tenants: Tenant[]; properties: Property[]; charges: MonthlyCharge[]; billingMonth: string }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [selected, setSelected] = useState<Tenant | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const savingRef = useRef(false);
  const [query, setQuery] = useState("");
  const [propertyFilter, setPropertyFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [detail, setDetail] = useState<Tenant | null>(null);
  const propertyNames = new Map(properties.map((property) => [property.id, property.name]));
  const rows = tenants.map((tenant) => ({ tenant, ledger: summarizeTenantCharges(charges, tenant.id, billingMonth) }));
  const filtered = rows.filter(({ tenant, ledger }) =>
    (!propertyFilter || tenant.propertyId === propertyFilter) && (!statusFilter || ledger.status === statusFilter) &&
    `${tenant.name} ${tenant.unit} ${propertyNames.get(tenant.propertyId) ?? ""}`.toLocaleLowerCase().includes(query.trim().toLocaleLowerCase())
  );
  const detailLedger = detail ? summarizeTenantCharges(charges, detail.id, billingMonth) : null;

  function start(tenant?: Tenant) {
    setSelected(tenant ?? null);
    setForm(tenant ? { name: tenant.name, propertyId: tenant.propertyId, unit: tenant.unit, rent: Number(tenant.rent.replace(/[^0-9]/g, "")) } : emptyForm);
    setError("");
    setOpen(true);
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (savingRef.current) return;
    const input = { ...form, name: form.name.trim(), unit: form.unit.trim() };
    if (!input.name || !input.propertyId || !input.unit || input.rent <= 0) { setError("이름, 속성, 호실, 월 임대료를 입력해 주세요."); return; }
    savingRef.current = true;
    setSaving(true);
    setError("");
    try { await saveTenant(input, selected?.id); setOpen(false); router.refresh(); }
    catch (cause) {
      const status = cause instanceof Error ? cause.message : "";
      setError(status === "401" ? "로그인이 만료되었습니다. 다시 로그인해 주세요." : status === "403" ? "현재 계정에는 임차인 관리 권한이 없습니다." : "저장하지 못했습니다. 같은 속성의 호실 중복 여부를 확인해 주세요.");
    } finally { savingRef.current = false; setSaving(false); }
  }

  return <>
    <div className="flex flex-wrap items-center justify-between gap-3 px-6 pt-5"><p className="text-sm text-muted-foreground">{billingMonth} 확정 청구 합계입니다. 승인 대기와 취소 금액은 제외합니다.</p><Button disabled={saving || !properties.length} onClick={() => start()}><PlusIcon data-icon="inline-start" />임차인 추가</Button></div>
    <div className="grid gap-4 px-6 py-4 sm:grid-cols-3">
      <FormField label="검색" htmlFor="tenant-search"><Input id="tenant-search" placeholder="임차인·자산명·호실" value={query} onChange={(event) => setQuery(event.target.value)} /></FormField>
      <FormField label="자산 필터" htmlFor="tenant-property-filter"><NativeSelect id="tenant-property-filter" className="w-full" value={propertyFilter} onChange={(event) => setPropertyFilter(event.target.value)}><NativeSelectOption value="">전체 자산</NativeSelectOption>{properties.map((property) => <NativeSelectOption key={property.id} value={property.id}>{property.name}</NativeSelectOption>)}</NativeSelect></FormField>
      <FormField label="납부 상태 필터" htmlFor="tenant-status-filter"><NativeSelect id="tenant-status-filter" className="w-full" value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)}><NativeSelectOption value="">전체 상태</NativeSelectOption>{Object.entries(tenantLedgerLabels).map(([value, label]) => <NativeSelectOption key={value} value={value}>{label}</NativeSelectOption>)}</NativeSelect></FormField>
    </div>
    <p className="px-6 pb-3 text-sm text-muted-foreground">전체 {tenants.length}명 중 {filtered.length}명{!properties.length && " · 임차인을 추가하려면 먼저 자산을 등록해 주세요."}</p>
    <div className="overflow-x-auto"><table className="w-full min-w-[980px] text-sm"><thead><tr className="border-b text-left text-muted-foreground"><th className="p-4 pl-6">임차인</th><th className="p-4">호실</th><th className="p-4">월 임대료</th><th className="p-4">청구</th><th className="p-4">납부</th><th className="p-4">미수</th><th className="p-4">상태</th><th className="p-4 pr-6 text-right">관리</th></tr></thead>
      <tbody>{filtered.map(({ tenant, ledger }) => <tr key={tenant.id} className="border-b">
        <td className="p-4 pl-6"><div className="font-medium">{tenant.name}</div><div className="mt-1 text-xs text-muted-foreground">{propertyNames.get(tenant.propertyId) ?? "연결되지 않은 자산"}</div></td>
        <td className="p-4">{tenant.unit}</td><td className="p-4">{tenant.rent}</td>
        <td className="p-4">{ledger.confirmedCount ? formatWon(ledger.billedWon) : "-"}</td><td className="p-4">{ledger.confirmedCount ? formatWon(ledger.receivedWon) : "-"}</td><td className="p-4">{ledger.confirmedCount ? formatWon(ledger.outstandingWon) : "-"}</td>
        <td className="p-4"><span className={ledger.status === "Overdue" ? "font-medium text-destructive" : "text-muted-foreground"}>{tenantLedgerLabels[ledger.status]}</span>{ledger.draftCount > 0 && <div className="mt-1 text-xs text-muted-foreground">승인 대기 {ledger.draftCount}건</div>}</td>
        <td className="p-4 pr-6"><div className="flex justify-end gap-2"><Button variant="outline" size="sm" aria-label={`${tenant.name} 청구 내역`} onClick={() => setDetail(tenant)}>청구 내역</Button><Button variant="ghost" size="sm" disabled={saving} onClick={() => start(tenant)}><PencilIcon data-icon="inline-start" />수정</Button></div></td>
      </tr>)}{!filtered.length && <tr><td colSpan={8} className="p-8 text-center text-muted-foreground">{tenants.length ? "검색 조건에 맞는 임차인이 없습니다." : "등록된 임차인이 없습니다."}</td></tr>}</tbody></table></div>
    <Dialog open={detail !== null} onOpenChange={(value) => { if (!value) setDetail(null); }}><DialogContent className="max-h-[calc(100dvh-2rem)] overflow-y-auto sm:max-w-2xl">
      <DialogHeader><DialogTitle>{detail?.name} 청구 내역</DialogTitle><DialogDescription>{billingMonth} 청구월의 개별 청구입니다. 초안과 취소 청구는 합계에 포함하지 않습니다.</DialogDescription></DialogHeader>
      {detailLedger?.charges.length ? <div className="overflow-x-auto"><table className="w-full text-sm"><thead><tr className="border-b text-left"><th className="p-2">납기일</th><th className="p-2">청구</th><th className="p-2">수납</th><th className="p-2">미수</th><th className="p-2">상태</th></tr></thead><tbody>{detailLedger.charges.map((charge) => <tr key={charge.id} className="border-b"><td className="p-2">{charge.dueDate}</td><td className="p-2">{formatWon(charge.billedWon)}</td><td className="p-2">{formatWon(charge.receivedWon)}</td><td className="p-2">{formatWon(charge.outstandingWon)}</td><td className="p-2">{tenantLedgerLabels[charge.status]}</td></tr>)}</tbody></table></div> : <p className="text-sm text-muted-foreground">해당 월 청구가 없습니다. 계약 상태와 청구 생성 여부를 확인해 주세요.</p>}
      <DialogFooter><Link href="/contracts" className="text-sm underline">계약 확인</Link><Link href={`/payments?billingMonth=${encodeURIComponent(billingMonth)}`} className="text-sm underline">수납 원장 열기</Link></DialogFooter>
    </DialogContent></Dialog>
    <Dialog open={open} onOpenChange={(value) => { if (!savingRef.current) setOpen(value); }}><DialogContent className="max-h-[calc(100dvh-2rem)] overflow-y-auto sm:max-w-lg"><DialogHeader><DialogTitle>{selected ? "임차인 수정" : "임차인 추가"}</DialogTitle><DialogDescription>임차인 기본 정보만 관리합니다. 납부 상태는 월별 청구와 영수증에서 계산됩니다.</DialogDescription></DialogHeader>
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
