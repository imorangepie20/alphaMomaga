import { getAdminAccess } from "@/lib/admin-access";
import { getAuditLogs } from "@/lib/audit-logs";
import { AdminAccessNotice } from "./admin-access-error";
import { Input } from "./ui/input";
import { Button } from "./ui/button";

export type AuditSearchParams = Record<string, string | string[] | undefined>;
const fields = [
  ["entityType", "대상 종류"], ["entityId", "대상 ID"],
  ["action", "작업"], ["actorSubject", "수행자"],
] as const;

export async function AdminAudit({ searchParams }: { searchParams: AuditSearchParams }) {
  try { await getAdminAccess("user:manage"); }
  catch (error) { return <AdminAccessNotice error={error} />; }

  const rawOffset = searchParams.offset;
  const offset = rawOffset === undefined ? 0 : Number(rawOffset);
  if (fields.some(([key]) => searchParams[key] !== undefined && typeof searchParams[key] !== "string") ||
    (rawOffset !== undefined && (typeof rawOffset !== "string" || !/^\d+$/.test(rawOffset))) ||
    !Number.isSafeInteger(offset) || offset < 0 || offset > 1_000_000) {
    return <div className="space-y-3"><p role="alert">조회 조건이 올바르지 않습니다. 조건을 초기화해 다시 조회해 주세요.</p><a className="underline" href="/admin/audit-logs">조회 조건 초기화</a></div>;
  }
  const filters = Object.fromEntries(fields.map(([key]) => [key, (searchParams[key] as string | undefined) || undefined]));
  let logs;
  try { logs = await getAuditLogs({ ...filters, offset, limit: 51 }); }
  catch (error) { return <AdminAccessNotice error={error} />; }
  const pageHref = (nextOffset: number) => {
    const query = new URLSearchParams();
    for (const [key, value] of Object.entries(filters)) if (value) query.set(key, value);
    query.set("offset", String(nextOffset));
    return `/admin/audit-logs?${query}`;
  };
  const visible = logs.slice(0, 50);
  return <div className="space-y-6">
    <header className="space-y-2"><h1 className="text-2xl font-semibold">변경 이력</h1><p className="text-sm text-muted-foreground">업무 변경 기록을 최신순으로 조회합니다. 수행자와 대상은 기록된 ID로 표시합니다.</p></header>
    <form action="/admin/audit-logs" className="flex flex-wrap items-end gap-3">
      {fields.map(([key, label]) => <div key={key} className="space-y-2"><label htmlFor={`audit-${key}`} className="text-sm">{label}</label><Input id={`audit-${key}`} name={key} defaultValue={filters[key] ?? ""} key={filters[key] ?? ""} /></div>)}
      <Button type="submit">조회</Button><a className="inline-flex min-h-11 items-center text-sm underline" href="/admin/audit-logs">초기화</a>
    </form>
    <p className="text-sm text-muted-foreground">현재 페이지 {visible.length}건 · 페이지당 최대 50건 · 전체 건수는 집계하지 않습니다.</p>
    {!visible.length && <p className="rounded-lg border p-5">조회 조건에 해당하는 기록이 없습니다.</p>}
    <div className="space-y-3">{visible.map((log) => <article className="space-y-3 rounded-lg border p-5 break-words" key={log.id}>
      <div className="flex flex-wrap justify-between gap-2"><h2 className="font-medium">{log.action}</h2><time className="text-sm text-muted-foreground" dateTime={log.createdAt}>{new Intl.DateTimeFormat("ko-KR", { timeZone: "Asia/Seoul", dateStyle: "medium", timeStyle: "medium" }).format(new Date(log.createdAt))} (서울)</time></div>
      <dl className="grid gap-3 text-sm sm:grid-cols-2"><div><dt className="text-muted-foreground">대상</dt><dd>{log.entityType} · {log.entityId}</dd></div><div><dt className="text-muted-foreground">수행자</dt><dd>{log.actorSubject}</dd><dd className="text-muted-foreground">{log.actorRole}</dd></div></dl>
      {log.metadata && <details><summary className="cursor-pointer py-2 text-sm">변경 내용·이전 완료 기록</summary><pre className="whitespace-pre-wrap break-all rounded-md bg-muted p-3 text-sm">{JSON.stringify(log.metadata, null, 2)}</pre></details>}
    </article>)}</div>
    <nav aria-label="변경 이력 페이지" className="flex gap-5">
      {offset > 0 && <a className="inline-flex min-h-11 items-center underline" href={pageHref(Math.max(0, offset - 50))}>이전</a>}
      {logs.length > 50 && offset + 50 <= 1_000_000 && <a className="inline-flex min-h-11 items-center underline" href={pageHref(offset + 50)}>다음</a>}
    </nav>
  </div>;
}
