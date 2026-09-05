import Link from "next/link";
import { requireSession } from "@/lib/require-session";
import { getAdminAccess } from "@/lib/admin-access";
import { permissionLabels, roleLabels } from "@/lib/admin-labels";
import { AdminAccessNotice } from "./admin-access-error";
import { Card, CardHeader, CardTitle, CardContent } from "./ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "./ui/table";

export async function AdminAccountPage({ mode }: { mode: "users" | "roles" | "settings" }) {
  const session = await requireSession();
  let access: Awaited<ReturnType<typeof getAdminAccess>>;
  try { access = await getAdminAccess(mode === "settings" ? undefined : "user:manage"); }
  catch (error) { return <AdminAccessNotice error={error} />; }
  const title = { users: "사용자", roles: "역할", settings: "설정" }[mode];
  return <div className="space-y-6">
    <header className="space-y-2"><h1 className="text-2xl font-semibold">{title}</h1><p className="text-sm text-muted-foreground">{mode === "roles" ? "API가 실제 적용하는 역할별 권한을 비교합니다." : mode === "users" ? "현재 인증된 계정과 계정 관리 범위를 확인합니다." : "현재 계정과 시스템의 실제 적용 기준을 확인합니다."}</p></header>
    <Card><CardHeader><CardTitle>현재 로그인 계정</CardTitle></CardHeader><CardContent><dl className="grid gap-5 text-sm sm:grid-cols-2"><div><dt className="text-muted-foreground">이름</dt><dd className="mt-1">{session.user.name ?? "미등록"}</dd></div><div><dt className="text-muted-foreground">이메일</dt><dd className="mt-1 break-all">{session.user.email ?? "제공되지 않음"}</dd></div><div><dt className="text-muted-foreground">API 확인 역할</dt><dd className="mt-1">{roleLabels[access.role.name] ?? access.role.name} ({access.role.name})</dd></div><div><dt className="text-muted-foreground">적용 권한</dt><dd className="mt-1">{access.role.permissions.length}개</dd></div></dl></CardContent></Card>
    {mode === "roles" ? <Card><CardHeader className="space-y-2"><CardTitle>역할별 권한 비교</CardTitle><p className="text-sm text-muted-foreground">허용은 해당 역할의 API 작업 권한입니다. 모든 사용자에게 부여되었다는 뜻이 아닙니다.</p></CardHeader><CardContent><Table><TableHeader><TableRow><TableHead>업무 권한</TableHead>{access.roles.map((role) => <TableHead key={role.name}>{roleLabels[role.name] ?? role.name}<p className="text-xs">{role.name}</p></TableHead>)}</TableRow></TableHeader><TableBody>{[...new Set(access.roles.flatMap((role) => role.permissions))].map((permission) => <TableRow key={permission}><TableCell>{permissionLabels[permission] ?? permission}<p className="text-xs text-muted-foreground">{permission}</p></TableCell>{access.roles.map((role) => <TableCell key={role.name}>{role.permissions.includes(permission) ? "허용" : "없음"}</TableCell>)}</TableRow>)}</TableBody></Table></CardContent></Card>
      : <Card><CardHeader><CardTitle>현재 계정 권한</CardTitle></CardHeader><CardContent><ul className="grid gap-3 text-sm sm:grid-cols-2">{access.role.permissions.map((permission) => <li key={permission}>{permissionLabels[permission] ?? permission}<span className="ml-2 text-xs text-muted-foreground">{permission}</span></li>)}</ul></CardContent></Card>}
    {mode === "settings" && <Card><CardHeader><CardTitle>운영 기본 설정</CardTitle></CardHeader><CardContent><dl className="grid gap-5 text-sm sm:grid-cols-2">{[["업무 시간대", "Asia/Seoul (서울)"], ["금액 단위", "대한민국 원 (KRW)"], ["화면 언어", "한국어"], ["화면 테마", "라이트 테마"], ["수납 집계 기준", "청구월별 확정 청구와 실제 수납 배분"], ["인증 방식", "Auth0 로그인 · API 역할 검증"]].map(([label, value]) => <div key={label}><dt className="text-muted-foreground">{label}</dt><dd className="mt-1">{value}</dd></div>)}</dl><p className="mt-5 text-sm text-muted-foreground">위 설정은 현재 시스템 적용값입니다. 변경 저장 API가 없는 항목은 편집 가능한 것처럼 표시하지 않습니다.</p></CardContent></Card>}
    <Card><CardHeader><CardTitle>계정·역할 변경 안내</CardTitle></CardHeader><CardContent className="space-y-3 text-sm"><p>관리자는 사용자 관리 화면에서 계정 조회·초대 링크 발급·차단·운영 역할 변경을 처리할 수 있습니다. 기존 관리자 계정 변경과 관리자 승격은 Auth0 관리 콘솔에서 처리합니다.</p><p>역할의 권한 구성은 서버 정책으로 관리됩니다. 역할을 변경한 뒤에는 다시 로그인하여 API 적용 역할을 확인해 주세요.</p><p className="text-muted-foreground">직원 수, 승인 대기 계정, 구독 결제 정보는 확인할 데이터가 없어 표시하지 않습니다.</p><nav className="flex flex-wrap gap-4"><Link href="/auth/logout" className="underline">로그아웃</Link><Link href="/settings" className="underline">계정 설정 확인</Link>{access.role.permissions.includes("user:manage") && <Link href="/admin/users" className="underline">사용자 관리</Link>}{mode !== "roles" && access.role.permissions.includes("user:manage") && <Link href="/admin/roles" className="underline">전체 역할 비교</Link>}</nav></CardContent></Card>
  </div>;
}
