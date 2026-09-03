import { getApiUrl } from "@/lib/api-url";

export type RoleName = "Admin" | "PropertyManager" | "Finance" | "Inspector";
export type Permission = "portfolio:read" | "tenant:manage" | "contract:manage" | "payment:manage" | "maintenance:manage" | "inspection:manage" | "user:manage" | "report:read";
export type RoleDefinition = { name: RoleName; permissions: Permission[] };

const fallbackRoles: RoleDefinition[] = [
  { name: "Admin", permissions: ["portfolio:read", "tenant:manage", "contract:manage", "payment:manage", "maintenance:manage", "inspection:manage", "user:manage", "report:read"] },
  { name: "PropertyManager", permissions: ["portfolio:read", "tenant:manage", "contract:manage", "payment:manage", "maintenance:manage", "inspection:manage", "report:read"] },
  { name: "Finance", permissions: ["portfolio:read", "payment:manage", "report:read"] },
  { name: "Inspector", permissions: ["portfolio:read", "inspection:manage", "report:read"] },
];

export async function getRoles(): Promise<RoleDefinition[]> {
  const apiUrl = getApiUrl();
  if (!apiUrl) return fallbackRoles;
  try {
    const response = await fetch(`${apiUrl}/admin/roles`, { cache: "no-store" });
    if (!response.ok) return fallbackRoles;
    return (await response.json()) as RoleDefinition[];
  } catch { return fallbackRoles; }
}