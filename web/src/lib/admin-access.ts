import "server-only";
import { auth0 } from "./auth0";
import { getApiUrl } from "./api-url";
import { getRoles, type Permission } from "./roles";

export class AdminAccessError extends Error {
  constructor(readonly status: number) { super(`Admin access failed: ${status}`); }
}

export async function getAdminAccess(permission?: Permission) {
  const apiUrl = getApiUrl();
  if (!apiUrl) throw new AdminAccessError(503);
  let token: string;
  try { token = (await auth0.getAccessToken()).token; }
  catch { throw new AdminAccessError(401); }
  const response = await fetch(`${apiUrl.replace(/\/$/, "")}/auth/me`, { cache: "no-store", headers: { authorization: `Bearer ${token}` } });
  if (!response.ok) throw new AdminAccessError(response.status);
  const principal = await response.json() as { role: string; subject: string };
  const roles = await getRoles();
  const role = roles.find((item) => item.name === principal.role);
  if (!role || typeof principal.subject !== "string") throw new AdminAccessError(401);
  if (permission && !role.permissions.includes(permission)) throw new AdminAccessError(403);
  return { principal, role, roles };
}
