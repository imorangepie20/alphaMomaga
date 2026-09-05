import { getApiUrl } from "@/lib/api-url";

export type RoleName = "Admin" | "PropertyManager" | "Finance" | "Inspector";
export type Permission =
  | "portfolio:read"
  | "property:manage"
  | "tenant:manage"
  | "contract:manage"
  | "payment:manage"
  | "billing:manage"
  | "maintenance:manage"
  | "inspection:manage"
  | "user:manage"
  | "report:read";
export type RoleDefinition = { name: RoleName; permissions: Permission[] };

export async function getRoles(): Promise<RoleDefinition[]> {
  const apiUrl = getApiUrl();
  if (!apiUrl) throw new Error("Roles API is not configured");
  const response = await fetch(`${apiUrl.replace(/\/$/, "")}/admin/roles`, {
    cache: "no-store",
  });
  if (!response.ok) throw new Error("Unable to load roles");
  return (await response.json()) as RoleDefinition[];
}
