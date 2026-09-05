import "server-only";
import { authenticatedFetch } from "./authenticated-fetch";
import { getApiUrl } from "./api-url";
import { AdminAccessError } from "./admin-access";

export type AuditLog = {
  id: string; action: string; actorSubject: string; actorRole: string;
  entityType: string; entityId: string; createdAt: string;
  metadata?: Record<string, unknown> | null;
};

export async function getAuditLogs(filters: {
  entityType?: string; entityId?: string; action?: string; actorSubject?: string;
  limit: number; offset: number;
}): Promise<AuditLog[]> {
  const apiUrl = getApiUrl();
  if (!apiUrl) throw new AdminAccessError(503);
  const query = new URLSearchParams();
  for (const [key, value] of Object.entries(filters)) {
    if (value !== undefined && value !== "") query.set(key, String(value));
  }
  const response = await authenticatedFetch(`${apiUrl.replace(/\/$/, "")}/admin/audit-logs?${query}`);
  if (!response.ok) throw new AdminAccessError(response.status);
  return await response.json() as AuditLog[];
}
