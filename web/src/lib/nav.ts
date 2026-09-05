import type { LucideIcon } from "lucide-react";
import type { Permission } from "./roles";
import {
  BarChart3,
  Building2,
  ClipboardCheck,
  CreditCard,
  FileText,
  LayoutDashboard,
  Settings,
  ShieldCheck,
  TrendingUp,
  Users,
  Wallet,
} from "lucide-react";

export type NavItem = { title: string; href: string; icon?: LucideIcon; permission?: Permission };
export type NavGroup = { label: string; items: NavItem[] };

export const navGroups: NavGroup[] = [
  {
    label: "개요",
    items: [
      { title: "대시보드", href: "/dashboard/real-estate", icon: LayoutDashboard },
      { title: "자산 현황", href: "/dashboard/portfolio", icon: Building2 },
      { title: "점유율", href: "/dashboard/occupancy", icon: TrendingUp },
      { title: "수익 현황", href: "/dashboard/revenue", icon: Wallet },
    ],
  },
  {
    label: "운영",
    items: [
      { title: "매물", href: "/properties", icon: Building2 },
      { title: "임차인", href: "/tenants", icon: Users },
      { title: "계약", href: "/contracts", icon: FileText },
      { title: "수납", href: "/payments", icon: CreditCard },
      { title: "유지보수", href: "/maintenance", icon: Settings },
      { title: "점검", href: "/inspections", icon: ClipboardCheck },
    ],
  },
  {
    label: "관리자",
    items: [
      { title: "사용자", href: "/admin/users", icon: Users, permission: "user:manage" },
      { title: "역할", href: "/admin/roles", icon: ShieldCheck, permission: "user:manage" },
      { title: "변경 이력", href: "/admin/audit-logs", icon: ClipboardCheck, permission: "user:manage" },
      { title: "보고서", href: "/admin/reports", icon: BarChart3, permission: "report:read" },
      { title: "설정", href: "/settings", icon: Settings },
    ],
  },
];

// Auth routes live outside the dashboard shell (the (auth) group).
export const authRoutes: NavItem[] = [
  { title: "Login", href: "/login" },
  { title: "Register", href: "/register" },
  { title: "Forgot Password", href: "/forgot-password" },
  { title: "Reset Password", href: "/reset-password" },
  { title: "Verify Email", href: "/verify" },
];

// Flat list of every dashboard-shell route (used by ⌘K and stub generation).
export const allNavItems: NavItem[] = navGroups.flatMap((g) => g.items);

export function navigationFor(permissions: Permission[]): NavGroup[] {
  return navGroups.map((group) => ({ ...group, items: group.items.filter((item) => !item.permission || permissions.includes(item.permission)) })).filter((group) => group.items.length > 0);
}
