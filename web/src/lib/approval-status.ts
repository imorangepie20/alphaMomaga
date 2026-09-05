import "server-only";
import { authenticatedFetch } from "./authenticated-fetch";
import { getApiUrl } from "./api-url";

export async function getApprovalStatus(): Promise<"approved" | "pending" | "unavailable"> {
  try {
    const api = getApiUrl();
    if (!api) return "unavailable";
    const response = await authenticatedFetch(`${api}/auth/status`);
    if (!response.ok) return "unavailable";
    const body = await response.json();
    return body.status === "approved" || body.status === "pending" ? body.status : "unavailable";
  } catch {
    return "unavailable";
  }
}
