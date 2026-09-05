"use client";
import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import type { ManagedDirectory, ManagedRole } from "@/lib/admin-users";
import { roleLabels } from "@/lib/admin-labels";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "./ui/table";

export function AdminUserManager({ directory, roles }: { directory: ManagedDirectory; roles: ManagedRole[] }) {
  const router = useRouter();
  const lock = useRef(false);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [ticket, setTicket] = useState("");
  const operationalRoles = roles.filter((role) => role.name !== "Admin");
  async function mutate(path: string, body: object) {
    if (lock.current) return;
    lock.current = true;
    setBusy(true); setMessage(""); setTicket("");
    try {
      const response = await fetch(`/api/admin-users/${path}`, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(body) });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(data.message ?? "계정 변경에 실패했습니다. 다시 로그인하거나 계정을 조회해 주세요.");
      if (data.ticket) setTicket(data.ticket);
      setMessage(data.ticket ? "초대 링크가 발급되었습니다. 이메일은 자동 발송되지 않았습니다." : "변경했습니다. 기존 로그인 토큰은 만료 전까지 유지될 수 있습니다.");
      router.refresh();
    } catch (error) { setMessage(error instanceof Error ? error.message : "변경에 실패했습니다."); }
    finally { lock.current = false; setBusy(false); }
  }
  return <div className="space-y-5">
    <details className="rounded-lg border p-4"><summary className="cursor-pointer font-medium">직원 계정 초대</summary><form className="mt-4 flex flex-wrap items-end gap-3" onSubmit={(event) => { event.preventDefault(); const form = new FormData(event.currentTarget); if (window.confirm(`${form.get("email")} 계정을 만들고 초대 링크를 발급할까요?`)) void mutate("invite", { email: form.get("email"), roleId: form.get("roleId") }); }}><div className="space-y-2"><label htmlFor="invite-email" className="text-sm">이메일</label><Input id="invite-email" name="email" type="email" required disabled={busy} /></div><div className="space-y-2"><label htmlFor="invite-role" className="text-sm">운영 역할</label><select id="invite-role" name="roleId" required disabled={busy} className="block h-9 rounded-md border bg-background px-3 text-sm"><option value="">역할 선택</option>{operationalRoles.map((role) => <option key={role.id} value={role.id}>{roleLabels[role.name] ?? role.name}</option>)}</select></div><Button type="submit" disabled={busy || !operationalRoles.length}>초대 링크 발급</Button></form><p className="mt-3 text-xs text-muted-foreground">데이터베이스 계정 전용입니다. 링크는 24시간 동안 유효하며 안전한 경로로 수신자에게 전달해야 합니다.</p></details>
    {message && <p role="status" className="rounded border p-3 text-sm">{message}</p>}
    {ticket && <div className="space-y-2 rounded border p-4"><label htmlFor="invite-ticket" className="text-sm">일회용 비밀번호 설정 링크 · 외부 공유 주의</label><Input id="invite-ticket" value={ticket} readOnly onFocus={(event) => event.target.select()} /><Button variant="outline" onClick={() => setTicket("")}>링크 숨기기</Button></div>}
    <Table><TableHeader><TableRow>{["계정", "이메일 확인", "역할", "계정 상태", "관리"].map((label) => <TableHead key={label}>{label}</TableHead>)}</TableRow></TableHeader><TableBody>{directory.users.map((user) => {
      const protectedUser = user.user_id === directory.subject || user.roles.some((role) => role.name === "Admin");
      return <TableRow key={user.user_id}><TableCell><p>{user.name ?? user.email ?? "이름 없음"}</p><p className="text-xs text-muted-foreground">{user.email}</p></TableCell><TableCell>{user.email_verified ? "확인됨" : "미확인"}</TableCell><TableCell>{user.roles.map((role) => roleLabels[role.name] ?? role.name).join(" · ") || "미할당"}</TableCell><TableCell>{user.blocked ? "차단" : "활성"}</TableCell><TableCell>{protectedUser ? <span className="text-xs text-muted-foreground">관리자·본인 보호</span> : <div className="flex flex-wrap gap-2"><form className="flex gap-2" onSubmit={(event) => { event.preventDefault(); const roleId = new FormData(event.currentTarget).get("roleId"); if (window.confirm("선택한 역할 하나로 변경합니다. 계속할까요?")) void mutate(`${encodeURIComponent(user.user_id)}/role`, { roleId }); }}><select aria-label={`${user.email ?? user.user_id} 역할`} name="roleId" required disabled={busy} className="rounded border bg-background px-2 text-sm" defaultValue=""><option value="">역할 선택</option>{operationalRoles.map((role) => <option key={role.id} value={role.id}>{roleLabels[role.name] ?? role.name}</option>)}</select><Button type="submit" variant="outline" size="sm" disabled={busy}>변경</Button></form><Button variant="outline" size="sm" disabled={busy} onClick={() => { if (window.confirm(`${user.email ?? "계정"} ${user.blocked ? "차단 해제" : "차단"}를 진행할까요?`)) void mutate(`${encodeURIComponent(user.user_id)}/block`, { blocked: !user.blocked }); }}>{user.blocked ? "차단 해제" : "차단"}</Button></div>}</TableCell></TableRow>;
    })}</TableBody></Table>
    {!directory.users.length && <p className="text-sm text-muted-foreground">조회된 계정이 없습니다.</p>}
  </div>;
}
