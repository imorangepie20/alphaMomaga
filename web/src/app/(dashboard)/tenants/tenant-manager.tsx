"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { PencilIcon, PlusIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { saveTenant, type TenantMutationInput } from "@/lib/tenant-mutation";
import type { Property } from "@/lib/properties";
import type { Tenant, TenantPaymentStatus } from "@/lib/tenants";

const emptyForm: TenantMutationInput = {
  name: "",
  propertyId: "",
  unit: "",
  rent: 0,
  status: "Pending",
};
export function TenantManager({
  tenants,
  properties,
}: {
  tenants: Tenant[];
  properties: Property[];
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [selected, setSelected] = useState<Tenant | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  function start(tenant?: Tenant) {
    setSelected(tenant ?? null);
    setForm(
      tenant
        ? {
            name: tenant.name,
            propertyId: tenant.propertyId,
            unit: tenant.unit,
            rent: Number(tenant.rent.replace(/[^0-9]/g, "")),
            status: tenant.status,
          }
        : emptyForm,
    );
    setError("");
    setOpen(true);
  }
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const input = { ...form, name: form.name.trim(), unit: form.unit.trim() };
    if (!input.name || !input.propertyId || !input.unit || input.rent <= 0) {
      setError("이름, 속성, 호실, 월 임대료를 입력해 주세요.");
      return;
    }
    setSaving(true);
    setError("");
    try {
      await saveTenant(input, selected?.id);
      setOpen(false);
      router.refresh();
    } catch (cause) {
      const status = cause instanceof Error ? cause.message : "";
      setError(
        status === "401"
          ? "로그인이 만료되었습니다. 다시 로그인해 주세요."
          : status === "403"
            ? "현재 계정에는 임차인 관리 권한이 없습니다."
            : "저장하지 못했습니다. 같은 속성의 호실 중복 여부를 확인해 주세요.",
      );
    } finally {
      setSaving(false);
    }
  }
  return (
    <>
      <div className="flex justify-end px-6 pt-5">
        <Button onClick={() => start()}>
          <PlusIcon data-icon="inline-start" />
          임차인 추가
        </Button>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b text-left text-muted-foreground">
              <th className="p-4 pl-6">임차인</th>
              <th className="p-4">호실</th>
              <th className="p-4">월 임대료</th>
              <th className="p-4">상태</th>
              <th className="p-4 pr-6 text-right">관리</th>
            </tr>
          </thead>
          <tbody>
            {tenants.map((tenant) => (
              <tr key={tenant.id} className="border-b">
                <td className="p-4 pl-6 font-medium">{tenant.name}</td>
                <td className="p-4">{tenant.unit}</td>
                <td className="p-4">{tenant.rent}</td>
                <td className="p-4">
                  {tenant.status === "Paid"
                    ? "납부 완료"
                    : tenant.status === "Overdue"
                      ? "연체"
                      : "미납"}
                </td>
                <td className="p-4 pr-6 text-right">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => start(tenant)}
                  >
                    <PencilIcon data-icon="inline-start" />
                    수정
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {selected ? "임차인 수정" : "임차인 추가"}
            </DialogTitle>
            <DialogDescription>
              저장하면 권한이 확인된 API 요청으로 반영됩니다.
            </DialogDescription>
          </DialogHeader>
          <form className="space-y-3" onSubmit={submit}>
            <div>
              <Label htmlFor="tenant-name">이름</Label>
              <Input
                id="tenant-name"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
              />
            </div>
            <div>
              <Label htmlFor="tenant-property">속성</Label>
              <select
                id="tenant-property"
                disabled={!!selected}
                className="mt-1 h-8 w-full rounded-lg border bg-transparent px-2"
                value={form.propertyId}
                onChange={(e) =>
                  setForm({ ...form, propertyId: e.target.value })
                }
              >
                <option value="">속성 선택</option>
                {properties.map((property) => (
                  <option key={property.id} value={property.id}>
                    {property.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <Label htmlFor="tenant-unit">호실</Label>
              <Input
                id="tenant-unit"
                value={form.unit}
                onChange={(e) => setForm({ ...form, unit: e.target.value })}
              />
            </div>
            <div>
              <Label htmlFor="tenant-rent">월 임대료</Label>
              <Input
                id="tenant-rent"
                type="number"
                min="1"
                value={form.rent}
                onChange={(e) =>
                  setForm({ ...form, rent: Number(e.target.value) })
                }
              />
            </div>
            <div>
              <Label htmlFor="tenant-status">상태</Label>
              <select
                id="tenant-status"
                className="mt-1 h-8 w-full rounded-lg border bg-transparent px-2"
                value={form.status}
                onChange={(e) =>
                  setForm({
                    ...form,
                    status: e.target.value as TenantPaymentStatus,
                  })
                }
              >
                <option value="Pending">미납</option>
                <option value="Paid">납부 완료</option>
                <option value="Overdue">연체</option>
              </select>
            </div>
            {error ? (
              <p role="alert" className="text-sm text-destructive">
                {error}
              </p>
            ) : null}
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setOpen(false)}
              >
                취소
              </Button>
              <Button type="submit" disabled={saving}>
                {saving ? "저장 중..." : "저장"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}
