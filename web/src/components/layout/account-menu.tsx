"use client";
import { ChevronDown, UserRound } from "lucide-react";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuItem } from "@/components/ui/dropdown-menu";

export function AccountMenu({ name, email }: { name: string; email?: string }) {
  return <DropdownMenu>
    <DropdownMenuTrigger render={<Button variant="ghost" className="h-9 gap-2 px-2" aria-label="계정 메뉴"><UserRound className="size-4" /><span className="hidden max-w-24 truncate text-sm sm:inline">{name}</span><ChevronDown className="size-3 text-muted-foreground" /></Button>} />
    <DropdownMenuContent align="end" className="w-56">
      <DropdownMenuLabel className="truncate">{email ?? "내 계정"}</DropdownMenuLabel>
      <DropdownMenuSeparator />
      <DropdownMenuItem render={<a href="/settings" />}>계정 설정</DropdownMenuItem>
      <DropdownMenuItem render={<a href="/auth/logout" />}>로그아웃</DropdownMenuItem>
    </DropdownMenuContent>
  </DropdownMenu>;
}
