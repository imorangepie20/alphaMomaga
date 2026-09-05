"use client";

import { Bell } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export function Notifications() {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={
          <Button variant="ghost" size="icon" className="relative" aria-label="알림">
            <Bell className="size-5" />
          </Button>
        }
      />
      <DropdownMenuContent align="end" className="w-80 border-border bg-card text-card-foreground">
        <DropdownMenuLabel>알림</DropdownMenuLabel>
        <DropdownMenuSeparator />
        <div className="space-y-3 p-3 text-sm"><p className="text-muted-foreground">알림 서비스가 아직 연결되지 않았습니다.</p><a href="/dashboard/real-estate" className="underline underline-offset-4">대시보드에서 처리 업무 확인</a></div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
