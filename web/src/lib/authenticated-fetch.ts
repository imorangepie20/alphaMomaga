import "server-only";
import { auth0 } from "./auth0";
import { getApiUrl } from "./api-url";

export async function authenticatedFetch(url: string, init: RequestInit = {}): Promise<Response> {
  const apiUrl = getApiUrl();
  if (!apiUrl || new URL(url).origin !== new URL(apiUrl).origin) {
    throw new Error("Unconfigured API origin");
  }
  const { token } = await auth0.getAccessToken();
  if (!token) throw new Error("Authenticated API session is required");
  return fetch(url, { ...init, cache: "no-store", headers: { authorization: `Bearer ${token}` }, redirect: "error" });
}
