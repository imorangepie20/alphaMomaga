"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { PencilIcon, PlusIcon } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { PropertyMutationError, saveProperty, type PropertyMutationInput } from "@/lib/property-mutation";
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

export function PropertyManager({ properties }: { properties: Property[] }) {
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
          <TableRow>
            <TableHead className="pl-6">자산명</TableHead><TableHead>위치</TableHead><TableHead>유형</TableHead><TableHead>점유율</TableHead><TableHead>상태</TableHead><TableHead className="pr-6 text-right">관리</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {properties.map((property) => (
            <TableRow key={property.id}>
              <TableCell className="pl-6 font-medium">{property.name}</TableCell><TableCell>{property.location}</TableCell><TableCell>{property.type}</TableCell><TableCell>{property.occupancy}</TableCell>
              <TableCell><Badge variant="outline" className={property.status === "Occupied" ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300" : "border-amber-500/30 bg-amber-500/10 text-amber-700 dark:text-amber-300"}>{property.status === "Occupied" ? "점유" : property.status === "Active" ? "운영 중" : "검토 중"}</Badge></TableCell>
              <TableCell className="pr-6 text-right"><Button variant="ghost" size="sm" onClick={() => openEditDialog(property)}><PencilIcon data-icon="inline-start" />수정</Button></TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader><DialogTitle>{selectedProperty ? "속성 수정" : "속성 추가"}</DialogTitle><DialogDescription>저장하면 권한이 확인된 API 요청으로 자산 정보가 반영됩니다.</DialogDescription></DialogHeader>
          <form className="space-y-4" onSubmit={handleSubmit}>
            <div className="grid gap-2"><Label htmlFor="property-name">이름</Label><Input id="property-name" value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} required /></div>
            <div className="grid gap-2 sm:grid-cols-2">
              <div className="grid gap-2"><Label htmlFor="property-location">위치</Label><Input id="property-location" value={form.location} onChange={(event) => setForm({ ...form, location: event.target.value })} required /></div>
              <div className="grid gap-2"><Label htmlFor="property-type">유형</Label><Input id="property-type" value={form.type} onChange={(event) => setForm({ ...form, type: event.target.value })} required /></div>
            </div>
            <div className="grid gap-2 sm:grid-cols-2">
              <div className="grid gap-2"><Label htmlFor="property-occupancy">점유율</Label><Input id="property-occupancy" type="number" min="0" max="100" value={form.occupancy} onChange={(event) => setForm({ ...form, occupancy: Number(event.target.value) })} required /></div>
              <div className="grid gap-2"><Label htmlFor="property-status">상태</Label><select id="property-status" className="h-8 rounded-lg border border-input bg-transparent px-2.5 text-sm" value={form.status} onChange={(event) => setForm({ ...form, status: event.target.value as PropertyStatus })}><option value="Active">운영 중</option><option value="Occupied">점유</option><option value="Pending">검토 중</option></select></div>
            </div>
            {error ? <p role="alert" className="text-sm text-destructive">{error}</p> : null}
            <DialogFooter><Button type="button" variant="outline" onClick={() => setOpen(false)} disabled={isSaving}>취소</Button><Button type="submit" disabled={isSaving}>{isSaving ? "저장 중..." : "저장"}</Button></DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}
