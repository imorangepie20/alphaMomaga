"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { PencilIcon, PlusIcon } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { FieldError, FormField } from "@/components/ui/field";
import { NativeSelect, NativeSelectOption } from "@/components/ui/native-select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { PropertyMutationError, saveProperty, type PropertyMutationInput } from "@/lib/property-mutation";
import type { PropertyOperationRow } from "@/lib/property-operations";
import type { Property, PropertyStatus } from "@/lib/properties";

type PropertyForm = PropertyMutationInput;

const emptyForm: PropertyForm = { name: "", location: "", type: "", occupancy: 0, status: "Active" };

function toForm(property: Property): PropertyForm {
  return { name: property.name, location: property.location, type: property.type, occupancy: Number.parseInt(property.occupancy, 10) || 0, status: property.status };
}

function getErrorMessage(error: unknown): string {
  if (error instanceof PropertyMutationError) {
    if (error.status === 401) return "로그인이 만료되었습니다. 다시 로그인해 주세요.";
    if (error.status === 403) return "현재 계정에는 속성 관리 권한이 없습니다.";
  }

  return "저장하지 못했습니다. 입력값을 확인한 뒤 다시 시도해 주세요.";
}

export function PropertyManager({ properties }: { properties: PropertyOperationRow[] }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [selectedProperty, setSelectedProperty] = useState<Property | null>(null);
  const [form, setForm] = useState<PropertyForm>(emptyForm);
  const [error, setError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  function openCreateDialog() {
    setSelectedProperty(null);
    setForm(emptyForm);
    setError(null);
    setOpen(true);
  }

  function openEditDialog(property: Property) {
    setSelectedProperty(property);
    setForm(toForm(property));
    setError(null);
    setOpen(true);
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const input = { ...form, name: form.name.trim(), location: form.location.trim(), type: form.type.trim() };

    if (!input.name || !input.location || !input.type || input.occupancy < 0 || input.occupancy > 100) {
      setError("이름, 위치, 유형을 입력하고 점유율은 0에서 100 사이로 설정해 주세요.");
      return;
    }

    setIsSaving(true);
    setError(null);
    try {
      await saveProperty(input, selectedProperty?.id);
      setOpen(false);
      router.refresh();
    } catch (submitError) {
      setError(getErrorMessage(submitError));
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <>
      <div className="flex items-center justify-between px-6 pt-5">
        <h2 className="text-lg font-semibold">자산 목록</h2>
        <Button onClick={openCreateDialog}><PlusIcon data-icon="inline-start" />속성 추가</Button>
      </div>
      <Table>
        <TableHeader>
          <TableRow><TableHead className="pl-6">자산</TableHead><TableHead>점유율</TableHead><TableHead>이번 달 수납</TableHead><TableHead>운영 현황</TableHead><TableHead>상태</TableHead><TableHead className="pr-6 text-right">관리</TableHead></TableRow>
        </TableHeader>
        <TableBody>
          {properties.map((property) => (
            <TableRow key={property.id}>
              <TableCell className="pl-6"><div className="font-medium">{property.name}</div><div className="mt-1 text-xs text-muted-foreground">{property.location} · {property.type}<br />임차인 {property.tenantCount}명 · 활성 계약 {property.activeContractCount}건</div></TableCell>
              <TableCell className="font-medium">{property.occupancy}</TableCell>
              <TableCell>
                <div className="text-sm">확정 청구 {property.billedWon.toLocaleString("ko-KR")}원</div>
                <div className={property.outstandingWon > 0 ? "mt-1 text-xs font-medium text-destructive" : "mt-1 text-xs text-muted-foreground"}>수납 {property.receivedWon.toLocaleString("ko-KR")}원 · 미수 {property.outstandingWon.toLocaleString("ko-KR")}원</div>
                {property.draftCount > 0 && <div className="mt-1 text-xs text-muted-foreground">청구 승인 대기 {property.draftCount}건</div>}
              </TableCell>
              <TableCell><div className="text-sm">미완료 업무 {property.openWorkCount}건</div><div className={property.expiringContractCount > 0 ? "mt-1 text-xs font-medium text-amber-700" : "mt-1 text-xs text-muted-foreground"}>90일 내 계약 만료 {property.expiringContractCount}건</div></TableCell>
              <TableCell><Badge variant="outline" className={property.needsAttention ? "border-amber-500/30 bg-amber-500/10 text-amber-700" : "border-emerald-500/30 bg-emerald-500/10 text-emerald-700"}>{property.needsAttention ? "확인 필요" : "정상"}</Badge></TableCell>
              <TableCell className="pr-6 text-right"><Button variant="ghost" size="sm" onClick={() => openEditDialog(property)}><PencilIcon data-icon="inline-start" />수정</Button></TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader><DialogTitle>{selectedProperty ? "속성 수정" : "속성 추가"}</DialogTitle><DialogDescription>저장하면 권한이 확인된 API 요청으로 자산 정보가 반영됩니다.</DialogDescription></DialogHeader>
          <form className="space-y-4" onSubmit={handleSubmit}>
            <FormField label="이름" htmlFor="property-name"><Input id="property-name" value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} required /></FormField>
              <div className="grid gap-3 sm:grid-cols-2">
              <FormField label="위치" htmlFor="property-location"><Input id="property-location" value={form.location} onChange={(event) => setForm({ ...form, location: event.target.value })} required /></FormField>
              <FormField label="유형" htmlFor="property-type"><Input id="property-type" value={form.type} onChange={(event) => setForm({ ...form, type: event.target.value })} required /></FormField>
            </div>
              <div className="grid gap-3 sm:grid-cols-2">
              <FormField label="점유율" htmlFor="property-occupancy"><Input id="property-occupancy" type="number" min="0" max="100" value={form.occupancy} onChange={(event) => setForm({ ...form, occupancy: Number(event.target.value) })} required /></FormField>
              <FormField label="상태" htmlFor="property-status"><NativeSelect className="w-full" id="property-status" value={form.status} onChange={(event) => setForm({ ...form, status: event.target.value as PropertyStatus })}><NativeSelectOption value="Active">운영 중</NativeSelectOption><NativeSelectOption value="Occupied">점유</NativeSelectOption><NativeSelectOption value="Pending">검토 중</NativeSelectOption></NativeSelect></FormField>
            </div>
            <FieldError>{error}</FieldError>
            <DialogFooter><Button type="button" variant="outline" onClick={() => setOpen(false)} disabled={isSaving}>취소</Button><Button type="submit" disabled={isSaving}>{isSaving ? "저장 중..." : "저장"}</Button></DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}
