import type { LucideIcon } from "lucide-react";
import {
  LayoutDashboard, ShoppingCart, CreditCard, Hotel, KanbanSquare,
  Building2, TrendingUp, Users, BarChart3, FolderOpen, Bitcoin,
  GraduationCap, Stethoscope, Wallet, StickyNote, MessageSquare,
  Share2, Mail, ListTodo, CheckSquare, Calendar, KeyRound, Store,
  BookOpen, Bot, Image as ImageIcon, AudioLines, UserCircle, Rocket,
  Layers, Settings, Tag, ShieldCheck, Bell, TriangleAlert, Boxes,
  Component, Blocks, FlaskConical, Globe, FileText, ClipboardCheck,
} from "lucide-react";

export type NavItem = { title: string; href: string; icon?: LucideIcon };
export type NavGroup = { label: string; items: NavItem[] };

export const navGroups: NavGroup[] = [
  {
    label: "Overview",
    items: [
      { title: "Dashboard", href: "/dashboard/real-estate", icon: LayoutDashboard },
      { title: "Portfolio", href: "/dashboard/portfolio", icon: Building2 },
      { title: "Occupancy", href: "/dashboard/occupancy", icon: TrendingUp },
      { title: "Revenue", href: "/dashboard/revenue", icon: Wallet },
    ],
  },
  {
    label: "Operations",
    items: [
      { title: "Properties", href: "/properties", icon: Building2 },
      { title: "Tenants", href: "/tenants", icon: Users },
      { title: "Contracts", href: "/contracts", icon: FileText },
      { title: "Payments", href: "/payments", icon: CreditCard },
      { title: "Maintenance", href: "/maintenance", icon: Settings },
      { title: "Inspections", href: "/inspections", icon: ClipboardCheck },
    ],
  },
  {
    label: "Admin",
    items: [
      { title: "Users", href: "/admin/users", icon: Users },
      { title: "Roles", href: "/admin/roles", icon: ShieldCheck },
      { title: "Reports", href: "/admin/reports", icon: BarChart3 },
      { title: "Settings", href: "/settings", icon: Settings },
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
