import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { AppFooter } from "@/components/layout/app-footer";
import { AppSidebar } from "@/components/layout/app-sidebar";
import { AppHeader } from "@/components/layout/app-header";
import { requireSession } from "@/lib/require-session";
import { getApprovalStatus } from "@/lib/approval-status";
import { redirect } from "next/navigation";
import { getAdminAccess } from "@/lib/admin-access";
import type { Permission } from "@/lib/roles";

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const session = await requireSession();
  if (await getApprovalStatus() !== "approved") redirect("/pending-approval");
  let permissions: Permission[] = [];
  let permissionLookupFailed = false;
  try { permissions = (await getAdminAccess()).role.permissions; }
  catch { permissionLookupFailed = true; }

  return (
    <SidebarProvider>
      <AppSidebar permissions={permissions} />
      <SidebarInset className="min-h-svh flex-col bg-background text-foreground">
        <AppHeader user={session.user} permissions={permissions} />
        {permissionLookupFailed && <p role="status" className="px-4 pt-4 text-sm text-muted-foreground">메뉴 권한을 확인하지 못했습니다. 관리자 메뉴를 숨겼습니다. 새로고침해 주세요.</p>}
        <main className="flex flex-1 flex-col gap-4 p-4">{children}</main>
        <AppFooter />
      </SidebarInset>
    </SidebarProvider>
  );
}
