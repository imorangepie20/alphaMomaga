import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { AppFooter } from "@/components/layout/app-footer";
import { AppSidebar } from "@/components/layout/app-sidebar";
import { AppHeader } from "@/components/layout/app-header";
import { requireSession } from "@/lib/require-session";

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const session = await requireSession();

  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset className="min-h-svh flex-col bg-background text-foreground">
        <AppHeader user={session.user} />
        <main className="flex flex-1 flex-col gap-4 p-4">{children}</main>
        <AppFooter />
      </SidebarInset>
    </SidebarProvider>
  );
}
