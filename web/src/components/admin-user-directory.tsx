import Link from "next/link";
import { getAdminAccess } from "@/lib/admin-access";
import { readAdminUsers, type ManagedDirectory, type ManagedRole } from "@/lib/admin-users";
import { AdminAccessNotice } from "./admin-access-error";
import { AdminUserManager } from "./admin-user-manager";
import { Input } from "./ui/input";
import { Button } from "./ui/button";

export async function AdminUserDirectory({ page = "0", email = "" }: { page?: string; email?: string }) {
  try { await getAdminAccess("user:manage"); } catch (error) { return <AdminAccessNotice error={error} />; }
  let directory: ManagedDirectory;
  let roles: ManagedRole[];
  const pageIndex = /^\d+$/.test(page) ? Number(page) : 0;
  try {
    directory = await readAdminUsers<ManagedDirectory>(`?page=${pageIndex}&email=${encodeURIComponent(email)}`);
    roles = await readAdminUsers<ManagedRole[]>("/roles");
  } catch (error) { return <div className="space-y-3"><h1 className="text-2xl font-semibold">사용자 관리</h1><p role="alert">{error instanceof Error ? error.message : "조회 실패"}</p><p className="text-sm text-muted-foreground">Management API 설정은 api/.env에서 확인합니다. 비밀 키를 브라우저나 채팅에 입력하지 마세요.</p><Link href="/admin/users" className="underline">다시 조회</Link></div>; }
  const pageUrl = (value: number) => `/admin/users?page=${value}&email=${encodeURIComponent(email)}`;
  return <div className="space-y-6"><header className="space-y-2"><h1 className="text-2xl font-semibold">사용자 관리</h1><p className="text-sm text-muted-foreground">Auth0 테넌트 계정 · 조회 결과 {directory.total}개 · 현재 {directory.page + 1}페이지</p></header><form action="/admin/users" className="flex flex-wrap items-end gap-3"><div className="space-y-2"><label htmlFor="user-email" className="text-sm">정확한 이메일로 조회</label><Input id="user-email" name="email" type="email" defaultValue={email} /></div><Button type="submit" variant="outline">조회</Button><Link href="/admin/users" className="text-sm underline">전체 목록</Link></form><AdminUserManager directory={directory} roles={roles} /><nav className="flex gap-4 text-sm">{!email && pageIndex > 0 && <Link href={pageUrl(pageIndex - 1)} className="underline">이전</Link>}{!email && pageIndex < 49 && (pageIndex + 1) * 20 < directory.total && <Link href={pageUrl(pageIndex + 1)} className="underline">다음</Link>}</nav><p className="text-sm text-muted-foreground">관리자 승격과 기존 관리자 계정 변경은 Auth0 콘솔에서 처리합니다. 차단·역할 변경은 이미 발급된 API 토큰을 즉시 회수하지 않습니다. 다른 앱과 공유하는 테넌트의 계정 변경에도 주의해 주세요.</p></div>;
}
