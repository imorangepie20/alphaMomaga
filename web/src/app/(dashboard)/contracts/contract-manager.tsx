"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { PencilIcon, PlusIcon, RefreshCwIcon } from "lucide-react";
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
import { FieldError, FormField } from "@/components/ui/field";
import { NativeSelect, NativeSelectOption } from "@/components/ui/native-select";
import {
  createContract,
  renewContract,
  updateContract,
  type CreateContractMutationInput,
  type RenewContractMutationInput,
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

function nextCalendarDay(value: string) {
  const date = new Date(`${value}T00:00:00.000Z`);
  date.setUTCDate(date.getUTCDate() + 1);
  return date.toISOString().slice(0, 10);
}

function canRenewContract(contract: Contract) {
  if (contract.status === "Active") return true;
  return (
    contract.status === "Expired" &&
    nextCalendarDay(contract.endDate) >= new Date().toISOString().slice(0, 10)
  );
}

function statusClass(status: ContractStatus) {
  if (status === "Active") {
    return "border-emerald-500/30 bg-emerald-500/10 text-emerald-700";
  }
  if (status === "Upcoming") {
    return "border-sky-500/30 bg-sky-500/10 text-sky-700";
  }
  if (status === "Expired") {
    return "border-amber-500/30 bg-amber-500/10 text-amber-700";
  }
  return "border-red-500/30 bg-red-500/10 text-red-700";
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
  const [renewalOpen, setRenewalOpen] = useState(false);
  const [renewalContract, setRenewalContract] = useState<Contract | null>(null);
  const [createForm, setCreateForm] = useState(emptyCreateForm);
  const [updateForm, setUpdateForm] = useState<UpdateContractMutationInput>({
    status: "Active",
  });
  const [renewalForm, setRenewalForm] = useState<RenewContractMutationInput>({
    startDate: "",
    endDate: "",
    monthlyRent: 0,
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

  function startRenewal(contract: Contract) {
    setRenewalContract(contract);
    setRenewalForm({
      startDate: nextCalendarDay(contract.endDate),
      endDate: "",
      monthlyRent: Number(contract.monthlyRent.replace(/[^0-9]/g, "")),
    });
    setError("");
    setRenewalOpen(true);
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

  async function submitRenewal(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!renewalContract) return;
    if (!renewalForm.endDate || renewalForm.monthlyRent <= 0) {
      setError("갱신 계약 종료일과 월 임대료를 입력해 주세요.");
      return;
    }

    setSaving(true);
    setError("");
    try {
      await renewContract(renewalContract.id, renewalForm);
      setRenewalOpen(false);
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
                  <div className="flex justify-end gap-1">
                    {canRenewContract(contract) && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => startRenewal(contract)}
                      >
                        <RefreshCwIcon data-icon="inline-start" />
                        갱신
                      </Button>
                    )}
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => startUpdate(contract)}
                    >
                      <PencilIcon data-icon="inline-start" />
                      상태 수정
                    </Button>
                  </div>
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
              <FormField label="상태" htmlFor="contract-status">
                <NativeSelect
                  id="contract-status"
                  className="w-full"
                  value={updateForm.status}
                  onChange={(event) =>
                    setUpdateForm({
                      ...updateForm,
                      status: event.target.value as ContractStatus,
                    })
                  }
                >
                  {Object.entries(statusLabels).map(([value, label]) => (
                    <NativeSelectOption key={value} value={value}>
                      {label}
                    </NativeSelectOption>
                  ))}
                </NativeSelect>
              </FormField>
              {updateForm.status === "Terminated" ? (
                <FormField label="해지일" htmlFor="contract-terminated-at">
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
                </FormField>
              ) : null}
              <FieldError>{error}</FieldError>
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
              <FormField label="임차인" htmlFor="contract-tenant">
                <NativeSelect
                  id="contract-tenant"
                  className="w-full"
                  value={createForm.tenantId}
                  onChange={(event) => selectTenant(event.target.value)}
                >
                  <NativeSelectOption value="">임차인 선택</NativeSelectOption>
                  {tenants.map((tenant) => (
                    <NativeSelectOption key={tenant.id} value={tenant.id}>
                      {tenant.name} · {tenant.unit}
                    </NativeSelectOption>
                  ))}
                </NativeSelect>
              </FormField>
              <FormField label="속성" htmlFor="contract-property">
                <Input
                  id="contract-property"
                  readOnly
                  value={
                    propertyNames.get(createForm.propertyId) ??
                    "임차인을 먼저 선택해 주세요"
                  }
                />
              </FormField>
              <FormField label="호실" htmlFor="contract-unit">
                <Input id="contract-unit" readOnly value={createForm.unit} />
              </FormField>
              <FormField label="월 임대료 (원)" htmlFor="contract-rent">
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
              </FormField>
              <div className="grid gap-3 sm:grid-cols-2">
                <FormField label="계약 시작일" htmlFor="contract-start-date">
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
                </FormField>
                <FormField label="계약 종료일" htmlFor="contract-end-date">
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
                </FormField>
              </div>
              <FormField label="상태" htmlFor="contract-create-status">
                <NativeSelect
                  id="contract-create-status"
                  className="w-full"
                  value={createForm.status}
                  onChange={(event) =>
                    setCreateForm({
                      ...createForm,
                      status: event.target.value as ContractStatus,
                    })
                  }
                >
                  {Object.entries(statusLabels).map(([value, label]) => (
                    <NativeSelectOption key={value} value={value}>
                      {label}
                    </NativeSelectOption>
                  ))}
                </NativeSelect>
              </FormField>
              <FieldError>{error}</FieldError>
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

      <Dialog open={renewalOpen} onOpenChange={setRenewalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>계약 갱신</DialogTitle>
            <DialogDescription>
              원본 계약의 임차인, 속성, 호실과 다음 시작일을 유지한 새 계약을
              등록합니다.
            </DialogDescription>
          </DialogHeader>
          {renewalContract ? (
            <form className="space-y-3" onSubmit={submitRenewal}>
              <FormField label="임차인" htmlFor="renewal-tenant">
                <Input
                  id="renewal-tenant"
                  readOnly
                  value={
                    tenantNames.get(renewalContract.tenantId) ?? "미지정 임차인"
                  }
                />
              </FormField>
              <FormField label="속성" htmlFor="renewal-property">
                <Input
                  id="renewal-property"
                  readOnly
                  value={
                    propertyNames.get(renewalContract.propertyId) ??
                    "알 수 없는 속성"
                  }
                />
              </FormField>
              <FormField label="호실" htmlFor="renewal-unit">
                <Input
                  id="renewal-unit"
                  readOnly
                  value={renewalContract.unit}
                />
              </FormField>
              <div className="grid gap-3 sm:grid-cols-2">
                <FormField label="다음 계약 시작일" htmlFor="renewal-start-date">
                  <Input
                    id="renewal-start-date"
                    readOnly
                    value={renewalForm.startDate}
                  />
                </FormField>
                <FormField label="갱신 계약 종료일" htmlFor="renewal-end-date">
                  <Input
                    id="renewal-end-date"
                    type="date"
                    min={nextCalendarDay(renewalForm.startDate)}
                    value={renewalForm.endDate}
                    onChange={(event) =>
                      setRenewalForm({
                        ...renewalForm,
                        endDate: event.target.value,
                      })
                    }
                  />
                </FormField>
              </div>
              <FormField label="갱신 월 임대료 (원)" htmlFor="renewal-rent">
                <Input
                  id="renewal-rent"
                  type="number"
                  min="1"
                  value={renewalForm.monthlyRent || ""}
                  onChange={(event) =>
                    setRenewalForm({
                      ...renewalForm,
                      monthlyRent: Number(event.target.value),
                    })
                  }
                />
              </FormField>
              <FieldError>{error}</FieldError>
              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setRenewalOpen(false)}
                >
                  취소
                </Button>
                <Button type="submit" disabled={saving}>
                  {saving ? "저장 중..." : "갱신 계약 저장"}
                </Button>
              </DialogFooter>
            </form>
          ) : null}
        </DialogContent>
      </Dialog>
    </>
  );
}
