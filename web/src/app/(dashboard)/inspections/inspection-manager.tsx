"use client";

import { useRef, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { useHydrated } from "@/hooks/use-hydrated";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { FormField } from "@/components/ui/field";
import { NativeSelect, NativeSelectOption } from "@/components/ui/native-select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import type { Inspection, InspectionStatus } from "@/lib/inspections";
import type { Property } from "@/lib/properties";

const labels: Record<InspectionStatus, string> = { Pending: "대기", Scheduled: "예정", InReview: "검토 중", Completed: "완료" };
type Form = Omit<Inspection, "id">;
const emptyForm: Form = { propertyId: "", type: "", scheduledDate: "", status: "Pending", priority: "Routine" };

function currentSeoulDate() {
  const parts = new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Seoul", year: "numeric", month: "2-digit", day: "2-digit" }).formatToParts(new Date());
  return ["year", "month", "day"].map((key) => parts.find((part) => part.type === key)?.value).join("-");
}

export function InspectionManager({ items, properties, today }: { items: Inspection[]; properties: Property[]; today: string }) {
  const hydrated = useHydrated();
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [propertyFilter, setPropertyFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [priorityFilter, setPriorityFilter] = useState("");
  const [open, setOpen] = useState(false);
  const [selected, setSelected] = useState<Inspection | null>(null);
  const [form, setForm] = useState<Form>(emptyForm);
  const [completionToday, setCompletionToday] = useState(today);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [busy, setBusy] = useState(false);
  const saving = useRef(false);
  const names = new Map(properties.map((property) => [property.id, property.name]));
  const overdue = (item: Inspection) => item.status !== "Completed" && item.scheduledDate < today;
  const filtered = items.filter((item) =>
    (!propertyFilter || item.propertyId === propertyFilter) &&
    (!priorityFilter || item.priority === priorityFilter) &&
    (!statusFilter || (statusFilter === "Overdue" ? overdue(item) : item.status === statusFilter)) &&
    `${names.get(item.propertyId) ?? ""} ${item.type}`.toLocaleLowerCase().includes(query.trim().toLocaleLowerCase())
  ).sort((a, b) => Number(overdue(b)) - Number(overdue(a)) || Number(a.status === "Completed") - Number(b.status === "Completed") || a.scheduledDate.localeCompare(b.scheduledDate) || a.id.localeCompare(b.id));

  function edit(item?: Inspection, status?: InspectionStatus) {
    setCompletionToday(currentSeoulDate());
    setSelected(item ?? null);
    setForm(item ? { propertyId: item.propertyId, type: item.type, scheduledDate: item.scheduledDate, status: status ?? item.status, priority: item.priority, completedAt: item.completedAt ?? "", result: item.result ?? "" } : { ...emptyForm });
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
      const response = await fetch(id ? `/api/proxy/inspections/${encodeURIComponent(id)}` : "/api/proxy/inspections", {
        method: id ? "PUT" : "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(input),
      });
      if (!response.ok) {
        const messages: Record<number, string> = {
          400: "저장하지 못했습니다. 자산, 예정일과 상태를 확인해 주세요.",
          401: "로그인이 만료되었습니다. 다시 로그인해 주세요.",
          403: "현재 계정에는 점검 관리 권한이 없습니다.",
          404: "점검을 찾을 수 없습니다. 목록을 새로고침해 주세요.",
        };
        throw new Error(messages[response.status] ?? "저장하지 못했습니다. 잠시 후 다시 시도해 주세요.");
      }
      setOpen(false);
      setNotice(id ? "점검을 수정했습니다." : "점검을 등록했습니다.");
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
    if (!form.type.trim() || !form.propertyId || !form.scheduledDate) {
      setError("자산, 점검 유형과 예정일을 입력해 주세요.");
      return;
    }
    if (form.status === "Completed" && (!form.completedAt || form.completedAt > currentSeoulDate() || !form.result?.trim())) {
      setError("실제 완료일을 오늘 이하의 날짜로 입력하고 점검 결과를 작성해 주세요.");
      return;
    }
    void save(selected
      ? { scheduledDate: form.scheduledDate, priority: form.priority, status: form.status, ...(form.status === "Completed" ? { completedAt: form.completedAt, result: form.result?.trim() } : {}) }
      : { propertyId: form.propertyId, type: form.type.trim(), scheduledDate: form.scheduledDate, status: form.status, priority: form.priority }, selected?.id);
  }

  const stats = [
    ["미완료 점검", items.filter((item) => item.status !== "Completed").length],
    ["긴급 미완료", items.filter((item) => item.status !== "Completed" && item.priority === "Urgent").length],
    ["기한 초과", items.filter(overdue).length],
    ["검토 중", items.filter((item) => item.status === "InReview").length],
    ["완료", items.filter((item) => item.status === "Completed").length],
  ] as const;

  return <div className="space-y-6">
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">{stats.map(([label, count]) => <Card key={label}><CardHeader><CardTitle>{label}</CardTitle></CardHeader><CardContent className="text-3xl font-semibold tabular-nums">{count}</CardContent></Card>)}</div>
    <p className="text-sm text-muted-foreground">{today} 기준 · 지표는 전체 점검 기준이며 완료 점검은 기한 초과에서 제외합니다.</p>
    {!open && error && <p role="alert" className="text-sm text-destructive">{error}</p>}
    {notice && <p role="status" className="text-sm">{notice}</p>}
    <Card>
      <CardHeader className="flex flex-row items-center justify-between gap-4"><CardTitle>점검 요청</CardTitle><Button onClick={() => edit()} disabled={!hydrated || busy || !properties.length}>점검 등록</Button></CardHeader>
      <CardContent className="space-y-4">
        {!properties.length && <p className="text-sm text-muted-foreground">점검을 등록하려면 먼저 매물 페이지에서 자산을 등록해 주세요.</p>}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <FormField label="검색" htmlFor="inspection-search"><Input id="inspection-search" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="자산명 또는 점검 유형" /></FormField>
          <FormField label="자산 필터" htmlFor="inspection-property-filter"><NativeSelect id="inspection-property-filter" className="w-full" value={propertyFilter} onChange={(event) => setPropertyFilter(event.target.value)}><NativeSelectOption value="">전체 자산</NativeSelectOption>{properties.map((property) => <NativeSelectOption key={property.id} value={property.id}>{property.name}</NativeSelectOption>)}</NativeSelect></FormField>
          <FormField label="상태 필터" htmlFor="inspection-status-filter"><NativeSelect id="inspection-status-filter" className="w-full" value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)}><NativeSelectOption value="">전체 상태</NativeSelectOption><NativeSelectOption value="Overdue">기한 초과</NativeSelectOption>{Object.entries(labels).map(([value, label]) => <NativeSelectOption key={value} value={value}>{label}</NativeSelectOption>)}</NativeSelect></FormField>
          <FormField label="긴급도 필터" htmlFor="inspection-priority-filter"><NativeSelect id="inspection-priority-filter" className="w-full" value={priorityFilter} onChange={(event) => setPriorityFilter(event.target.value)}><NativeSelectOption value="">전체 긴급도</NativeSelectOption><NativeSelectOption value="Routine">일반</NativeSelectOption><NativeSelectOption value="Urgent">긴급</NativeSelectOption></NativeSelect></FormField>
        </div>
        <p className="text-sm text-muted-foreground">전체 {items.length}건 중 {filtered.length}건 · 기한 초과, 미완료, 예정일 순</p>
        <Table><TableHeader><TableRow><TableHead>자산명</TableHead><TableHead>점검 유형</TableHead><TableHead>예정일</TableHead><TableHead>긴급도</TableHead><TableHead>상태</TableHead><TableHead className="text-right">관리</TableHead></TableRow></TableHeader>
          <TableBody>{filtered.map((item) => <TableRow key={item.id}>
            <TableCell>{names.get(item.propertyId) ?? "연결되지 않은 자산"}</TableCell><TableCell className="font-medium">{item.type}</TableCell>
            <TableCell><div>{item.scheduledDate}</div>{overdue(item) && <span className="text-xs text-destructive">기한 초과</span>}</TableCell>
            <TableCell><Badge variant="outline">{item.priority === "Urgent" ? "긴급" : "일반"}</Badge></TableCell>
            <TableCell><Badge variant="outline">{labels[item.status]}</Badge>{item.status === "Completed" && <><div className="mt-1 text-xs text-muted-foreground">완료일 {item.completedAt}</div><p className="mt-1 max-w-sm whitespace-pre-wrap break-words text-xs text-muted-foreground">{item.result || "점검 결과 기록 없음"}</p></>}</TableCell>
            <TableCell><div className="flex justify-end gap-2">
              {(item.status === "Pending" || item.status === "Scheduled") && <Button variant="outline" size="sm" disabled={!hydrated || busy} aria-label={`${item.type} 검토 시작`} onClick={() => void save({ status: "InReview" }, item.id)}>검토 시작</Button>}
              {item.status === "InReview" && <Button variant="outline" size="sm" disabled={!hydrated || busy} aria-label={`${item.type} 완료 처리`} onClick={() => edit(item, "Completed")}>완료 처리</Button>}
              <Button variant="ghost" size="sm" disabled={!hydrated || busy} aria-label={`${item.type} 일정·상태 수정`} onClick={() => edit(item)}>일정·상태 수정</Button>
            </div></TableCell>
          </TableRow>)}{!filtered.length && <TableRow><TableCell colSpan={6} className="h-28 text-center text-muted-foreground">{items.length ? "검색 조건에 맞는 점검이 없습니다." : "등록된 점검이 없습니다. 점검 등록으로 첫 요청을 추가해 주세요."}</TableCell></TableRow>}</TableBody>
        </Table>
      </CardContent>
    </Card>
    <Dialog open={open} onOpenChange={(value) => { if (!saving.current) setOpen(value); }}>
      <DialogContent className="max-h-[calc(100dvh-2rem)] overflow-y-auto sm:max-w-lg">
        <DialogHeader><DialogTitle>{selected ? "점검 일정·상태 수정" : "점검 등록"}</DialogTitle><DialogDescription>{selected ? "예정일과 처리 상태를 변경합니다. 완료는 실제 점검을 마친 후 선택해 주세요." : "대상 자산과 점검 유형, 예정일을 입력해 주세요."}</DialogDescription></DialogHeader>
        <form onSubmit={submit} className="space-y-4">
          <FormField label="자산" htmlFor="inspection-property"><NativeSelect id="inspection-property" className="w-full" value={form.propertyId} disabled={!!selected || busy} required onChange={(event) => setForm({ ...form, propertyId: event.target.value })}><NativeSelectOption value="">자산 선택</NativeSelectOption>{properties.map((property) => <NativeSelectOption key={property.id} value={property.id}>{property.name}</NativeSelectOption>)}{selected && !names.has(selected.propertyId) && <NativeSelectOption value={selected.propertyId}>연결되지 않은 자산</NativeSelectOption>}</NativeSelect></FormField>
          <FormField label="점검 유형" htmlFor="inspection-task"><Input id="inspection-task" value={form.type} readOnly={!!selected} disabled={!hydrated || busy} required onChange={(event) => setForm({ ...form, type: event.target.value })} /></FormField>
          <div className="grid gap-4 sm:grid-cols-2">
            <FormField label="예정일" htmlFor="inspection-due"><Input id="inspection-due" type="date" value={form.scheduledDate} required disabled={!hydrated || busy} onChange={(event) => setForm({ ...form, scheduledDate: event.target.value })} /></FormField>
            <FormField label="상태" htmlFor="inspection-status"><NativeSelect id="inspection-status" className="w-full" value={form.status} disabled={!hydrated || busy} onChange={(event) => setForm({ ...form, status: event.target.value as InspectionStatus })}>{Object.entries(labels).map(([value, label]) => <NativeSelectOption key={value} value={value} disabled={!selected && value === "Completed"}>{label}</NativeSelectOption>)}</NativeSelect></FormField>
          </div>
          <FormField label="긴급도" htmlFor="inspection-priority"><NativeSelect id="inspection-priority" className="w-full" value={form.priority} disabled={!hydrated || busy} onChange={(event) => setForm({ ...form, priority: event.target.value as Inspection["priority"] })}><NativeSelectOption value="Routine">일반</NativeSelectOption><NativeSelectOption value="Urgent">긴급</NativeSelectOption></NativeSelect></FormField>
          {selected && form.status === "Completed" && <FormField label="완료일" htmlFor="inspection-completed"><Input id="inspection-completed" type="date" required max={completionToday} disabled={!hydrated || busy} value={form.completedAt ?? ""} onFocus={() => setCompletionToday(currentSeoulDate())} onChange={(event) => { setCompletionToday(currentSeoulDate()); setForm({ ...form, completedAt: event.target.value }); }} /></FormField>}
          {selected && form.status === "Completed" && <FormField label="점검 결과" htmlFor="inspection-result"><Textarea id="inspection-result" required maxLength={4000} disabled={busy} value={form.result ?? ""} placeholder="확인 항목, 발견 사항과 후속 조치 내용을 기록해 주세요." onChange={(event) => setForm({ ...form, result: event.target.value })} /></FormField>}
          {selected?.status === "Completed" && form.status !== "Completed" && <p className="text-sm text-muted-foreground">재점검 전환 시 현재 완료일과 결과는 비워지며 이전 기록은 감사 이력에 보존됩니다.</p>}
          {error && <p role="alert" className="text-sm text-destructive">{error}</p>}
          <DialogFooter><Button type="button" variant="outline" disabled={!hydrated || busy} onClick={() => setOpen(false)}>취소</Button><Button type="submit" disabled={!hydrated || busy}>{busy ? "저장 중..." : "저장"}</Button></DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  </div>;
}
