import type { ManagedRole } from "./admin-users";

export function managedApproval(roles: ManagedRole[]): "pending" | "approved" | "review" {
  const recognized = new Set(roles.map((role) => role.name).filter((name) => ["Admin", "PropertyManager", "Finance", "Inspector"].includes(name)));
  return recognized.size === 0 ? "pending" : recognized.size === 1 ? "approved" : "review";
}

export const approvalLabels = { pending: "승인 대기", approved: "역할 부여됨", review: "역할 검토 필요" };
