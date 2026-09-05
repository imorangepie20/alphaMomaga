"use client";
import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import type { ManagedDirectory, ManagedRole } from "@/lib/admin-users";
import { managedApproval, approvalLabels } from "@/lib/managed-approval";
import { NativeSelect, NativeSelectOption } from "./ui/native-select";
import { roleLabels } from "@/lib/admin-labels";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { AlertDialog, AlertDialogContent, AlertDialogHeader, AlertDialogTitle, AlertDialogDescription, AlertDialogFooter, AlertDialogCancel, AlertDialogAction } from "./ui/alert-dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "./ui/table";

export function AdminUserManager({ directory, roles }: { directory: ManagedDirectory; roles: ManagedRole[] }) {
  const router = useRouter();
  const [approvalFilter, setApprovalFilter] = useState("");
  const visibleUsers = directory.users.filter((user) => !approvalFilter || managedApproval(user.roles) === approvalFilter);
  const lock = useRef(false);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [ticket, setTicket] = useState("");
  const [confirmation, setConfirmation] = useState<{ title: string; description: string; path: string; body: object; destructive?: boolean } | null>(null);
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
    finally { lock.current = false; setBusy(false); setConfirmation(null); }
  }
  return <div className="space-y-5">
    <AlertDialog open={confirmation !== null} onOpenChange={(open) => { if (!open && !lock.current) setConfirmation(null); }}>
      <AlertDialogContent className="max-h-[calc(100dvh-2rem)] overflow-y-auto">
        <AlertDialogHeader><AlertDialogTitle>{confirmation?.title}</AlertDialogTitle><AlertDialogDescription>{confirmation?.description}</AlertDialogDescription></AlertDialogHeader>
        <AlertDialogFooter><AlertDialogCancel disabled={busy}>취소</AlertDialogCancel><AlertDialogAction type="button" variant={confirmation?.destructive ? "destructive" : "default"} disabled={busy} onClick={() => { if (confirmation) void mutate(confirmation.path, confirmation.body); }}>{busy ? "처리 중..." : "확인"}</AlertDialogAction></AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
    <details className="rounded-lg border p-4"><summary className="cursor-pointer font-medium">직원 계정 초대</summary><form className="mt-4 flex flex-wrap items-end gap-3" onSubmit={(event) => { event.preventDefault(); const form = new FormData(event.currentTarget); setConfirmation({ title: "직원 계정 초대", description: `${form.get("email")} 계정을 만들고 24시간 유효한 초대 링크를 발급합니다. 이메일은 자동 발송되지 않습니다.`, path: "invite", body: { email: form.get("email"), roleId: form.get("roleId") } }); }}><div className="space-y-2"><label htmlFor="invite-email" className="text-sm">이메일</label><Input id="invite-email" name="email" type="email" required disabled={busy} /></div><div className="space-y-2"><label htmlFor="invite-role" className="text-sm">운영 역할</label><select id="invite-role" name="roleId" required disabled={busy} className="block h-9 rounded-md border bg-background px-3 text-sm"><option value="">역할 선택</option>{operationalRoles.map((role) => <option key={role.id} value={role.id}>{roleLabels[role.name] ?? role.name}</option>)}</select></div><Button type="submit" disabled={busy || !operationalRoles.length}>초대 링크 발급</Button></form><p className="mt-3 text-xs text-muted-foreground">데이터베이스 계정 전용입니다. 링크는 24시간 동안 유효하며 안전한 경로로 수신자에게 전달해야 합니다.</p></details>
    {message && <p role="status" className="rounded border p-3 text-sm">{message}</p>}
    {ticket && <div className="space-y-2 rounded border p-4"><label htmlFor="invite-ticket" className="text-sm">일회용 비밀번호 설정 링크 · 외부 공유 주의</label><Input id="invite-ticket" value={ticket} readOnly onFocus={(event) => event.target.select()} /><Button variant="outline" onClick={() => setTicket("")}>링크 숨기기</Button></div>}
    <div className="space-y-2">
      <label htmlFor="approval-filter" className="text-sm">업무 승인 필터</label>
      <NativeSelect id="approval-filter" value={approvalFilter} onChange={(event) => setApprovalFilter(event.target.value)}>
        <NativeSelectOption value="">전체 승인 상태</NativeSelectOption>
        {Object.entries(approvalLabels).map(([value, label]) => <NativeSelectOption key={value} value={value}>{label}</NativeSelectOption>)}
      </NativeSelect>
      <p className="text-sm text-muted-foreground">현재 페이지 {directory.users.length}명 중 {visibleUsers.length}명 · 필터는 이 페이지에만 적용됩니다. 다른 가입자는 다음 페이지 또는 이메일 검색으로 확인하세요.</p>
      <p className="text-sm text-muted-foreground">승인 대기 계정은 운영 역할 하나를 선택하고 변경을 확인하세요. 차단 계정은 차단 해제도 필요합니다. 승인 후 사용자에게 재로그인을 안내해 주세요.</p>
    </div>
    <Table><TableHeader><TableRow>{["계정", "이메일 확인", "역할", "업무 승인", "계정 상태", "관리"].map((label) => <TableHead key={label}>{label}</TableHead>)}</TableRow></TableHeader><TableBody>{visibleUsers.map((user) => {
      const protectedUser = user.user_id === directory.subject || user.roles.some((role) => role.name === "Admin");
      return <TableRow key={user.user_id}><TableCell><p>{user.name ?? user.email ?? "이름 없음"}</p><p className="text-xs text-muted-foreground">{user.email}</p></TableCell><TableCell>{user.email_verified ? "확인됨" : "미확인"}</TableCell><TableCell>{user.roles.map((role) => roleLabels[role.name] ?? role.name).join(" · ") || "미할당"}</TableCell><TableCell>{approvalLabels[managedApproval(user.roles)]}</TableCell><TableCell>{user.blocked ? "차단" : "활성"}</TableCell><TableCell>{protectedUser ? <span className="text-xs text-muted-foreground">관리자·본인 보호</span> : <div className="flex flex-wrap gap-2"><form className="flex gap-2" onSubmit={(event) => { event.preventDefault(); const roleId = new FormData(event.currentTarget).get("roleId"); setConfirmation({ title: "운영 역할 변경", description: `${user.email ?? "계정"}의 기존 운영 역할을 ${roleLabels[roles.find((role) => role.id === roleId)?.name ?? ""] ?? "선택한 역할"} 하나로 변경합니다. 기존 로그인 토큰은 즉시 회수되지 않습니다.`, path: `${encodeURIComponent(user.user_id)}/role`, body: { roleId } }); }}><select aria-label={`${user.email ?? user.user_id} 역할`} name="roleId" required disabled={busy} className="rounded border bg-background px-2 text-sm" defaultValue=""><option value="">역할 선택</option>{operationalRoles.map((role) => <option key={role.id} value={role.id}>{roleLabels[role.name] ?? role.name}</option>)}</select><Button type="submit" variant="outline" size="sm" disabled={busy}>변경</Button></form><Button variant="outline" size="sm" disabled={busy} onClick={() => { setConfirmation({ title: user.blocked ? "계정 차단 해제" : "계정 차단", description: `${user.email ?? "계정"}의 ${user.blocked ? "로그인을 다시 허용합니다." : "새 로그인을 차단합니다. 기존 API 토큰은 즉시 회수되지 않으며, 같은 테넌트의 다른 앱에도 영향을 줄 수 있습니다."}`, path: `${encodeURIComponent(user.user_id)}/block`, body: { blocked: !user.blocked }, destructive: !user.blocked }); }}>{user.blocked ? "차단 해제" : "차단"}</Button></div>}</TableCell></TableRow>;
    })}</TableBody></Table>
    {!visibleUsers.length && <p className="text-sm text-muted-foreground">현재 페이지에서 해당 승인 상태의 계정이 없습니다.</p>}
  </div>;
}
