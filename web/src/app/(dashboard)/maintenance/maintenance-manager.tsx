"use client";

import { useRef, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { useHydrated } from "@/hooks/use-hydrated";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { FormField } from "@/components/ui/field";
import { NativeSelect, NativeSelectOption } from "@/components/ui/native-select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import type { Maintenance, MaintenanceStatus } from "@/lib/maintenance";
import type { Property } from "@/lib/properties";

const labels: Record<MaintenanceStatus, string> = { Pending: "대기", Scheduled: "예정", InProgress: "진행 중", Completed: "완료" };
type Form = Omit<Maintenance, "id">;
const emptyForm: Form = { propertyId: "", task: "", dueDate: "", status: "Pending" };

export function MaintenanceManager({ items, properties, today }: { items: Maintenance[]; properties: Property[]; today: string }) {
  const hydrated = useHydrated();
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [propertyFilter, setPropertyFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [open, setOpen] = useState(false);
  const [selected, setSelected] = useState<Maintenance | null>(null);
  const [form, setForm] = useState<Form>(emptyForm);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [busy, setBusy] = useState(false);
  const saving = useRef(false);
  const names = new Map(properties.map((property) => [property.id, property.name]));
  const overdue = (item: Maintenance) => item.status !== "Completed" && item.dueDate < today;
  const filtered = items.filter((item) =>
    (!propertyFilter || item.propertyId === propertyFilter) &&
    (!statusFilter || (statusFilter === "Overdue" ? overdue(item) : item.status === statusFilter)) &&
    `${names.get(item.propertyId) ?? ""} ${item.task}`.toLocaleLowerCase().includes(query.trim().toLocaleLowerCase())
  ).sort((a, b) => Number(overdue(b)) - Number(overdue(a)) || Number(a.status === "Completed") - Number(b.status === "Completed") || a.dueDate.localeCompare(b.dueDate) || a.id.localeCompare(b.id));

  function edit(item?: Maintenance, status?: MaintenanceStatus) {
    setSelected(item ?? null);
    setForm(item ? { propertyId: item.propertyId, task: item.task, dueDate: item.dueDate, status: status ?? item.status } : { ...emptyForm });
    setError("");
    setNotice("");
    setOpen(true);
  }

  async function save(input: Partial<Form>, id?: string) {
    if (saving.current) return;
    saving.current = true;
    setBusy(true);
    setError("");
    setNotice("");
    try {
      const response = await fetch(id ? `/api/proxy/maintenance/${encodeURIComponent(id)}` : "/api/proxy/maintenance", {
        method: id ? "PUT" : "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(input),
      });
      if (!response.ok) {
        const messages: Record<number, string> = {
          400: "저장하지 못했습니다. 자산, 예정일과 상태를 확인해 주세요.",
          401: "로그인이 만료되었습니다. 다시 로그인해 주세요.",
          403: "현재 계정에는 유지보수 관리 권한이 없습니다.",
          404: "작업을 찾을 수 없습니다. 목록을 새로고침해 주세요.",
        };
        throw new Error(messages[response.status] ?? "저장하지 못했습니다. 잠시 후 다시 시도해 주세요.");
      }
      setOpen(false);
      setNotice(id ? "작업을 수정했습니다." : "작업을 등록했습니다.");
      router.refresh();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "연결을 확인하고 다시 시도해 주세요.");
    } finally {
      saving.current = false;
      setBusy(false);
    }
  }

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!form.task.trim() || !form.propertyId || !form.dueDate) {
      setError("자산, 작업 내용과 예정일을 입력해 주세요.");
      return;
    }
    void save(selected ? { dueDate: form.dueDate, status: form.status } : { ...form, task: form.task.trim() }, selected?.id);
  }

  const stats = [
    ["미완료 작업", items.filter((item) => item.status !== "Completed").length],
    ["기한 초과", items.filter(overdue).length],
    ["진행 중", items.filter((item) => item.status === "InProgress").length],
    ["완료", items.filter((item) => item.status === "Completed").length],
  ] as const;

  return <div className="space-y-6">
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">{stats.map(([label, count]) => <Card key={label}><CardHeader><CardTitle>{label}</CardTitle></CardHeader><CardContent className="text-3xl font-semibold tabular-nums">{count}</CardContent></Card>)}</div>
    <p className="text-sm text-muted-foreground">{today} 기준 · 지표는 전체 작업 기준이며 완료 작업은 기한 초과에서 제외합니다.</p>
    {!open && error && <p role="alert" className="text-sm text-destructive">{error}</p>}
    {notice && <p role="status" className="text-sm">{notice}</p>}
    <Card>
      <CardHeader className="flex flex-row items-center justify-between gap-4"><CardTitle>작업 요청</CardTitle><Button onClick={() => edit()} disabled={!hydrated || busy || !properties.length}>작업 등록</Button></CardHeader>
      <CardContent className="space-y-4">
        {!properties.length && <p className="text-sm text-muted-foreground">작업을 등록하려면 먼저 매물 페이지에서 자산을 등록해 주세요.</p>}
        <div className="grid gap-4 sm:grid-cols-3">
          <FormField label="검색" htmlFor="maintenance-search"><Input id="maintenance-search" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="자산명 또는 작업 내용" /></FormField>
          <FormField label="자산 필터" htmlFor="maintenance-property-filter"><NativeSelect id="maintenance-property-filter" className="w-full" value={propertyFilter} onChange={(event) => setPropertyFilter(event.target.value)}><NativeSelectOption value="">전체 자산</NativeSelectOption>{properties.map((property) => <NativeSelectOption key={property.id} value={property.id}>{property.name}</NativeSelectOption>)}</NativeSelect></FormField>
          <FormField label="상태 필터" htmlFor="maintenance-status-filter"><NativeSelect id="maintenance-status-filter" className="w-full" value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)}><NativeSelectOption value="">전체 상태</NativeSelectOption><NativeSelectOption value="Overdue">기한 초과</NativeSelectOption>{Object.entries(labels).map(([value, label]) => <NativeSelectOption key={value} value={value}>{label}</NativeSelectOption>)}</NativeSelect></FormField>
        </div>
        <p className="text-sm text-muted-foreground">전체 {items.length}건 중 {filtered.length}건 · 기한 초과, 미완료, 예정일 순</p>
        <Table><TableHeader><TableRow><TableHead>자산명</TableHead><TableHead>작업 내용</TableHead><TableHead>예정일</TableHead><TableHead>상태</TableHead><TableHead className="text-right">관리</TableHead></TableRow></TableHeader>
          <TableBody>{filtered.map((item) => <TableRow key={item.id}>
            <TableCell>{names.get(item.propertyId) ?? "연결되지 않은 자산"}</TableCell><TableCell className="font-medium">{item.task}</TableCell>
            <TableCell><div>{item.dueDate}</div>{overdue(item) && <span className="text-xs text-destructive">기한 초과</span>}</TableCell>
            <TableCell><Badge variant="outline">{labels[item.status]}</Badge></TableCell>
            <TableCell><div className="flex justify-end gap-2">
              {(item.status === "Pending" || item.status === "Scheduled") && <Button variant="outline" size="sm" disabled={!hydrated || busy} aria-label={`${item.task} 작업 시작`} onClick={() => void save({ status: "InProgress" }, item.id)}>작업 시작</Button>}
              {item.status === "InProgress" && <Button variant="outline" size="sm" disabled={!hydrated || busy} aria-label={`${item.task} 완료 처리`} onClick={() => edit(item, "Completed")}>완료 처리</Button>}
              <Button variant="ghost" size="sm" disabled={!hydrated || busy} aria-label={`${item.task} 일정·상태 수정`} onClick={() => edit(item)}>일정·상태 수정</Button>
            </div></TableCell>
          </TableRow>)}{!filtered.length && <TableRow><TableCell colSpan={5} className="h-28 text-center text-muted-foreground">{items.length ? "검색 조건에 맞는 작업이 없습니다." : "등록된 작업이 없습니다. 작업 등록으로 첫 요청을 추가해 주세요."}</TableCell></TableRow>}</TableBody>
        </Table>
      </CardContent>
    </Card>
    <Dialog open={open} onOpenChange={(value) => { if (!saving.current) setOpen(value); }}>
      <DialogContent className="max-h-[calc(100dvh-2rem)] overflow-y-auto sm:max-w-lg">
        <DialogHeader><DialogTitle>{selected ? "작업 일정·상태 수정" : "작업 등록"}</DialogTitle><DialogDescription>{selected ? "예정일과 처리 상태를 변경합니다. 완료는 실제 작업을 마친 후 선택해 주세요." : "대상 자산과 작업 내용, 예정일을 입력해 주세요."}</DialogDescription></DialogHeader>
        <form onSubmit={submit} className="space-y-4">
          <FormField label="자산" htmlFor="maintenance-property"><NativeSelect id="maintenance-property" className="w-full" value={form.propertyId} disabled={!!selected || busy} required onChange={(event) => setForm({ ...form, propertyId: event.target.value })}><NativeSelectOption value="">자산 선택</NativeSelectOption>{properties.map((property) => <NativeSelectOption key={property.id} value={property.id}>{property.name}</NativeSelectOption>)}{selected && !names.has(selected.propertyId) && <NativeSelectOption value={selected.propertyId}>연결되지 않은 자산</NativeSelectOption>}</NativeSelect></FormField>
          <FormField label="작업 내용" htmlFor="maintenance-task"><Input id="maintenance-task" value={form.task} readOnly={!!selected} disabled={!hydrated || busy} required onChange={(event) => setForm({ ...form, task: event.target.value })} /></FormField>
          <div className="grid gap-4 sm:grid-cols-2">
            <FormField label="예정일" htmlFor="maintenance-due"><Input id="maintenance-due" type="date" value={form.dueDate} required disabled={!hydrated || busy} onChange={(event) => setForm({ ...form, dueDate: event.target.value })} /></FormField>
            <FormField label="상태" htmlFor="maintenance-status"><NativeSelect id="maintenance-status" className="w-full" value={form.status} disabled={!hydrated || busy} onChange={(event) => setForm({ ...form, status: event.target.value as MaintenanceStatus })}>{Object.entries(labels).map(([value, label]) => <NativeSelectOption key={value} value={value}>{label}</NativeSelectOption>)}</NativeSelect></FormField>
          </div>
          {error && <p role="alert" className="text-sm text-destructive">{error}</p>}
          <DialogFooter><Button type="button" variant="outline" disabled={!hydrated || busy} onClick={() => setOpen(false)}>취소</Button><Button type="submit" disabled={!hydrated || busy}>{busy ? "저장 중..." : "저장"}</Button></DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  </div>;
}
