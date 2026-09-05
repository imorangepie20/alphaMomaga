import type { User } from "@auth0/nextjs-auth0/types";
import type { Permission } from "@/lib/roles";

import { SidebarTrigger } from "@/components/ui/sidebar";
import { Separator } from "@/components/ui/separator";
import { Breadcrumbs } from "@/components/layout/breadcrumbs";
import { CommandPalette } from "@/components/layout/command-palette";
import { AccountMenu } from "./account-menu";

interface AppHeaderProps {
  user: User;
  permissions?: Permission[];
}

export function AppHeader({ user, permissions = [] }: AppHeaderProps) {
  const displayName = user.name ?? user.nickname ?? user.email ?? "Account";

  return (
    <header className="flex h-16 shrink-0 items-center gap-2 border-b border-border bg-card px-4 text-card-foreground">
      <SidebarTrigger className="-ml-1" />
      <Separator orientation="vertical" className="mr-2 h-4" />
      <Breadcrumbs />
      <div className="ml-auto flex shrink-0 items-center gap-1 sm:gap-2">
        <CommandPalette permissions={permissions} />
        <Separator orientation="vertical" className="mx-1 h-5" />
        <AccountMenu name={displayName} email={user.email} />
      </div>
    </header>
  );
}
