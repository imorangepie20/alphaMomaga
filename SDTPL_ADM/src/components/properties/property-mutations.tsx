"use client";

import { useState } from "react";
import { Pencil, Plus, Save, X } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { Property, PropertyStatus } from "@/lib/properties";

type PropertyMutationsProps = {
  initialProperties: Property[];
  apiUrl: string;
};

type FormValues = {
  name: string;
  location: string;
  type: string;
  occupancy: string;
  status: PropertyStatus;
};

const emptyForm: FormValues = {
  name: "",
  location: "",
  type: "",
  occupancy: "0",
  status: "Active",
};

function toFormValues(property: Property): FormValues {
  return {
    name: property.name,
    location: property.location,
    type: property.type,
    occupancy: property.occupancy.replace("%", ""),
    status: property.status,
  };
}

export function PropertyMutations({ initialProperties, apiUrl }: PropertyMutationsProps) {
  const [properties, setProperties] = useState(initialProperties);
  const [form, setForm] = useState<FormValues>(emptyForm);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  function updateField(field: keyof FormValues, value: string) {
    setForm((current) => ({ ...current, [field]: value }));
  }

  function startEditing(property: Property) {
    setEditingId(property.id);
    setForm(toFormValues(property));
    setError("");
  }

  function cancelEditing() {
    setEditingId(null);
    setForm(emptyForm);
    setError("");
  }

  async function saveProperty(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");

    const token = window.localStorage.getItem("property-manager-token");
    if (!token) {
      setError("인증 토큰이 없습니다. property-manager-token을 설정한 뒤 다시 시도하세요.");
      return;
    }

    const occupancy = Number(form.occupancy);
    if (!form.name.trim() || !form.location.trim() || !form.type.trim()) {
      setError("이름, 위치, 유형을 입력하세요.");
      return;
    }
    if (!Number.isInteger(occupancy) || occupancy < 0 || occupancy > 100) {
      setError("점유율은 0에서 100 사이의 정수여야 합니다.");
      return;
    }

    setIsSaving(true);
    try {
      const isEditing = editingId !== null;
      const response = await fetch(
        `${apiUrl}/properties${isEditing ? `/${editingId}` : ""}`,
        {
          method: isEditing ? "PUT" : "POST",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            name: form.name.trim(),
            location: form.location.trim(),
            type: form.type.trim(),
            occupancy,
            status: form.status,
          }),
        },
      );

      if (!response.ok) {
        const body = (await response.json().catch(() => null)) as { message?: string } | null;
        throw new Error(body?.message ?? `저장에 실패했습니다 (${response.status})`);
      }

      const saved = (await response.json()) as Property;
      setProperties((current) =>
        isEditing
          ? current.map((property) => (property.id === saved.id ? saved : property))
          : [...current, saved],
      );
      cancelEditing();
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : "저장에 실패했습니다.");
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle>{editingId ? "매물 수정" : "매물 추가"}</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={saveProperty} className="grid gap-3 md:grid-cols-6">
            <div className="space-y-1 md:col-span-2">
              <Label htmlFor="property-name">이름</Label>
              <Input id="property-name" value={form.name} onChange={(event) => updateField("name", event.target.value)} required />
            </div>
            <div className="space-y-1 md:col-span-2">
              <Label htmlFor="property-location">위치</Label>
              <Input id="property-location" value={form.location} onChange={(event) => updateField("location", event.target.value)} required />
            </div>
            <div className="space-y-1">
              <Label htmlFor="property-type">유형</Label>
              <Input id="property-type" value={form.type} onChange={(event) => updateField("type", event.target.value)} required />
            </div>
            <div className="space-y-1">
              <Label htmlFor="property-occupancy">점유율</Label>
              <Input id="property-occupancy" type="number" min="0" max="100" value={form.occupancy} onChange={(event) => updateField("occupancy", event.target.value)} required />
            </div>
            <div className="space-y-1">
              <Label htmlFor="property-status">상태</Label>
              <select id="property-status" value={form.status} onChange={(event) => updateField("status", event.target.value)} className="border-input bg-background h-8 w-full rounded-lg border px-2 text-sm">
                <option value="Active">운영 중</option>
                <option value="Occupied">점유</option>
                <option value="Pending">검토 중</option>
              </select>
            </div>
            <div className="flex items-end gap-2 md:col-span-2">
              <Button type="submit" disabled={isSaving}>
                {editingId ? <Save data-icon="inline-start" /> : <Plus data-icon="inline-start" />}
                {isSaving ? "저장 중" : editingId ? "수정 저장" : "매물 추가"}
              </Button>
              {editingId && (
                <Button type="button" variant="outline" onClick={cancelEditing} aria-label="수정 취소">
                  <X />
                </Button>
              )}
            </div>
          </form>
          {error && <p role="alert" className="mt-3 text-sm text-destructive">{error}</p>}
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>자산 목록</CardTitle></CardHeader>
        <CardContent className="px-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b text-left">
                  <th className="p-3 pl-6 font-medium">자산명</th>
                  <th className="p-3 font-medium">위치</th>
                  <th className="p-3 font-medium">유형</th>
                  <th className="p-3 font-medium">점유율</th>
                  <th className="p-3 font-medium">상태</th>
                  <th className="p-3 pr-6 text-right font-medium">작업</th>
                </tr>
              </thead>
              <tbody>
                {properties.map((property) => (
                  <tr key={property.id} className="border-b last:border-0">
                    <td className="p-3 pl-6 font-medium">{property.name}</td>
                    <td className="p-3">{property.location}</td>
                    <td className="p-3">{property.type}</td>
                    <td className="p-3">{property.occupancy}</td>
                    <td className="p-3">
                      <Badge variant="outline">{property.status === "Occupied" ? "점유" : property.status === "Active" ? "운영 중" : "검토 중"}</Badge>
                    </td>
                    <td className="p-3 pr-6 text-right">
                      <Button type="button" variant="ghost" size="icon-sm" onClick={() => startEditing(property)} aria-label={`${property.name} 수정`}>
                        <Pencil />
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </>
  );
}
