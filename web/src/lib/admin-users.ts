import "server-only";
import { auth0 } from "./auth0";
import { getApiUrl } from "./api-url";

export type ManagedRole = { id: string; name: string };
export type ManagedUser = { user_id: string; name?: string; email?: string; blocked: boolean; email_verified: boolean; last_login?: string; roles: ManagedRole[] };
export type ManagedDirectory = { users: ManagedUser[]; total: number; page: number; pageSize: number; subject: string };

export async function readAdminUsers<T>(path: string): Promise<T> {
  const base = getApiUrl();
  if (!base) throw new Error("API 주소가 설정되지 않았습니다.");
  const token = (await auth0.getAccessToken()).token;
  const response = await fetch(`${base.replace(/\/$/, "")}/admin/users${path}`, { headers: { authorization: `Bearer ${token}` }, cache: "no-store" });
  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(typeof error.message === "string" ? error.message : "계정 조회에 실패했습니다.");
  }
  return response.json() as Promise<T>;
}
