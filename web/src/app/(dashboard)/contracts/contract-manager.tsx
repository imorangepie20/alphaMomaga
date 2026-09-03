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
import {
  createContract,
  updateContract,
  type CreateContractMutationInput,
  type UpdateContractMutationInput,
} from "@/lib/contract-mutation";
import type { Contract, ContractStatus } from "@/lib/contracts";
import type { Property } from "@/lib/properties";
import type { Tenant } from "@/lib/tenants";

const emptyCreateForm: CreateContractMutationInput = {
  propertyId: "",
  tenantId: "",
  unit: "",
  monthlyRent: 0,
  startDate: "",
  endDate: "",
  status: "Upcoming",
};

const statusLabels: Record<ContractStatus, string> = {
  Upcoming: "시작 전",
  Active: "유효",
  Expired: "만료",
  Terminated: "해지",
};

function statusClass(status: ContractStatus) {
  if (status === "Active") {
    return "border-emerald-500/30 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300";
  }
  if (status === "Upcoming") {
    return "border-sky-500/30 bg-sky-500/10 text-sky-700 dark:text-sky-300";
  }
  if (status === "Expired") {
    return "border-amber-500/30 bg-amber-500/10 text-amber-700 dark:text-amber-300";
  }
  return "border-red-500/30 bg-red-500/10 text-red-700 dark:text-red-300";
}

function mutationErrorMessage(cause: unknown) {
  const status = cause instanceof Error ? cause.message : "";
  if (status === "401") return "로그인이 만료되었습니다. 다시 로그인해 주세요.";
  if (status === "403") return "현재 계정에는 계약 관리 권한이 없습니다.";
  if (status === "400") {
    return "계약 날짜와 상태를 확인해 주세요. 상태는 계약 기간 및 해지일과 일치해야 합니다.";
  }
  return "저장하지 못했습니다. 잠시 후 다시 시도해 주세요.";
}

export function ContractManager({
  contracts,
  tenants,
  properties,
}: {
  contracts: Contract[];
  tenants: Tenant[];
  properties: Property[];
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [selected, setSelected] = useState<Contract | null>(null);
  const [createForm, setCreateForm] = useState(emptyCreateForm);
  const [updateForm, setUpdateForm] = useState<UpdateContractMutationInput>({
    status: "Active",
  });
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const propertyNames = new Map(
    properties.map((property) => [property.id, property.name]),
  );
  const tenantNames = new Map(
    tenants.map((tenant) => [tenant.id, tenant.name]),
  );

  function startCreate() {
    setSelected(null);
    setCreateForm(emptyCreateForm);
    setError("");
    setOpen(true);
  }

  function startUpdate(contract: Contract) {
    setSelected(contract);
    setUpdateForm({
      status: contract.status,
      ...(contract.terminatedAt ? { terminatedAt: contract.terminatedAt } : {}),
    });
    setError("");
    setOpen(true);
  }

  function selectTenant(tenantId: string) {
    const tenant = tenants.find((item) => item.id === tenantId);
    setCreateForm({
      ...createForm,
      tenantId,
      propertyId: tenant?.propertyId ?? "",
      unit: tenant?.unit ?? "",
      monthlyRent: tenant ? Number(tenant.rent.replace(/[^0-9]/g, "")) : 0,
    });
  }

  async function submitCreate(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (
      !createForm.tenantId ||
      !createForm.propertyId ||
      !createForm.unit ||
      createForm.monthlyRent <= 0 ||
      !createForm.startDate ||
      !createForm.endDate
    ) {
      setError("임차인, 임대료, 계약 시작일과 종료일을 입력해 주세요.");
      return;
    }

    setSaving(true);
    setError("");
    try {
      await createContract(createForm);
      setOpen(false);
      router.refresh();
    } catch (cause) {
      setError(mutationErrorMessage(cause));
    } finally {
      setSaving(false);
    }
  }

  async function submitUpdate(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!selected) return;
    if (updateForm.status === "Terminated" && !updateForm.terminatedAt) {
      setError("해지 상태에는 해지일이 필요합니다.");
      return;
    }

    setSaving(true);
    setError("");
    try {
      await updateContract(selected.id, {
        status: updateForm.status,
        ...(updateForm.status === "Terminated" && updateForm.terminatedAt
          ? { terminatedAt: updateForm.terminatedAt }
          : {}),
      });
      setOpen(false);
      router.refresh();
    } catch (cause) {
      setError(mutationErrorMessage(cause));
    } finally {
      setSaving(false);
    }
  }

  return (
    <>
      <div className="flex justify-end px-6 pt-5">
        <Button onClick={startCreate}>
          <PlusIcon data-icon="inline-start" />
          계약 추가
        </Button>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b text-left text-muted-foreground">
              <th className="p-4 pl-6">임차인</th>
              <th className="p-4">속성 / 호실</th>
              <th className="p-4">월 임대료</th>
              <th className="p-4">계약 기간</th>
              <th className="p-4">상태</th>
              <th className="p-4 pr-6 text-right">관리</th>
            </tr>
          </thead>
          <tbody>
            {contracts.map((contract) => (
              <tr key={contract.id} className="border-b">
                <td className="p-4 pl-6 font-medium">
                  {tenantNames.get(contract.tenantId) ?? "미지정 임차인"}
                </td>
                <td className="p-4">
                  <p>
                    {propertyNames.get(contract.propertyId) ??
                      "알 수 없는 속성"}
                  </p>
                  <p className="text-muted-foreground">{contract.unit}</p>
                </td>
                <td className="p-4">{contract.monthlyRent}</td>
                <td className="p-4">
                  <p>{contract.startDate}</p>
                  <p className="text-muted-foreground">~ {contract.endDate}</p>
                </td>
                <td className="p-4">
                  <span
                    className={`inline-flex rounded-full border px-2 py-0.5 text-xs ${statusClass(contract.status)}`}
                  >
                    {statusLabels[contract.status]}
                  </span>
                  {contract.terminatedAt ? (
                    <p className="mt-1 text-xs text-muted-foreground">
                      해지일 {contract.terminatedAt}
                    </p>
                  ) : null}
                </td>
                <td className="p-4 pr-6 text-right">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => startUpdate(contract)}
                  >
                    <PencilIcon data-icon="inline-start" />
                    상태 수정
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
              {selected ? "계약 상태 수정" : "계약 추가"}
            </DialogTitle>
            <DialogDescription>
              {selected
                ? "계약 상태와 해지일만 변경할 수 있습니다."
                : "임차인을 선택하면 속성과 호실이 자동으로 연결됩니다."}
            </DialogDescription>
          </DialogHeader>
          {selected ? (
            <form className="space-y-3" onSubmit={submitUpdate}>
              <div className="rounded-lg border bg-muted/30 p-3 text-sm">
                <p className="font-medium">
                  {tenantNames.get(selected.tenantId) ?? "미지정 임차인"}
                </p>
                <p className="text-muted-foreground">
                  {selected.unit} · {selected.startDate} ~ {selected.endDate}
                </p>
              </div>
              <div>
                <Label htmlFor="contract-status">상태</Label>
                <select
                  id="contract-status"
                  className="mt-1 h-9 w-full rounded-lg border bg-transparent px-2"
                  value={updateForm.status}
                  onChange={(event) =>
                    setUpdateForm({
                      ...updateForm,
                      status: event.target.value as ContractStatus,
                    })
                  }
                >
                  {Object.entries(statusLabels).map(([value, label]) => (
                    <option key={value} value={value}>
                      {label}
                    </option>
                  ))}
                </select>
              </div>
              {updateForm.status === "Terminated" ? (
                <div>
                  <Label htmlFor="contract-terminated-at">해지일</Label>
                  <Input
                    id="contract-terminated-at"
                    type="date"
                    value={updateForm.terminatedAt ?? ""}
                    onChange={(event) =>
                      setUpdateForm({
                        ...updateForm,
                        terminatedAt: event.target.value,
                      })
                    }
                  />
                </div>
              ) : null}
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
          ) : (
            <form className="space-y-3" onSubmit={submitCreate}>
              <div>
                <Label htmlFor="contract-tenant">임차인</Label>
                <select
                  id="contract-tenant"
                  className="mt-1 h-9 w-full rounded-lg border bg-transparent px-2"
                  value={createForm.tenantId}
                  onChange={(event) => selectTenant(event.target.value)}
                >
                  <option value="">임차인 선택</option>
                  {tenants.map((tenant) => (
                    <option key={tenant.id} value={tenant.id}>
                      {tenant.name} · {tenant.unit}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <Label htmlFor="contract-property">속성</Label>
                <Input
                  id="contract-property"
                  readOnly
                  value={
                    propertyNames.get(createForm.propertyId) ??
                    "임차인을 먼저 선택해 주세요"
                  }
                />
              </div>
              <div>
                <Label htmlFor="contract-unit">호실</Label>
                <Input id="contract-unit" readOnly value={createForm.unit} />
              </div>
              <div>
                <Label htmlFor="contract-rent">월 임대료 (원)</Label>
                <Input
                  id="contract-rent"
                  type="number"
                  min="1"
                  value={createForm.monthlyRent || ""}
                  onChange={(event) =>
                    setCreateForm({
                      ...createForm,
                      monthlyRent: Number(event.target.value),
                    })
                  }
                />
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                <div>
                  <Label htmlFor="contract-start-date">계약 시작일</Label>
                  <Input
                    id="contract-start-date"
                    type="date"
                    value={createForm.startDate}
                    onChange={(event) =>
                      setCreateForm({
                        ...createForm,
                        startDate: event.target.value,
                      })
                    }
                  />
                </div>
                <div>
                  <Label htmlFor="contract-end-date">계약 종료일</Label>
                  <Input
                    id="contract-end-date"
                    type="date"
                    value={createForm.endDate}
                    onChange={(event) =>
                      setCreateForm({
                        ...createForm,
                        endDate: event.target.value,
                      })
                    }
                  />
                </div>
              </div>
              <div>
                <Label htmlFor="contract-create-status">상태</Label>
                <select
                  id="contract-create-status"
                  className="mt-1 h-9 w-full rounded-lg border bg-transparent px-2"
                  value={createForm.status}
                  onChange={(event) =>
                    setCreateForm({
                      ...createForm,
                      status: event.target.value as ContractStatus,
                    })
                  }
                >
                  {Object.entries(statusLabels).map(([value, label]) => (
                    <option key={value} value={value}>
                      {label}
                    </option>
                  ))}
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
                  {saving ? "저장 중..." : "계약 저장"}
                </Button>
              </DialogFooter>
            </form>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
