import "server-only";

import { auth0 } from "./auth0";
import { getApiUrl } from "./api-url";

function isAllowedPath(path: string): boolean {
  return path === "payment-receipts" || path.startsWith("monthly-charges/") || path.startsWith("payment-receipts/") || path.startsWith("billing-runs/");
}

export async function forwardBillingMutation(path: string, request: Request): Promise<Response> {
  if (request.method !== "POST" || !isAllowedPath(path)) return new Response(null, { status: 404 });
  const apiUrl = getApiUrl();
  if (!apiUrl) return new Response(null, { status: 503 });
  let token: string;
  try { token = (await auth0.getAccessToken()).token; } catch { return new Response(null, { status: 401 }); }
  try {
    const response = await fetch(new URL(path, `${apiUrl.replace(/\/$/, "")}/`), {
      method: "POST",
      headers: { authorization: `Bearer ${token}`, "content-type": request.headers.get("content-type") ?? "application/json" },
      body: await request.arrayBuffer(),
      cache: "no-store",
    });
    return new Response(response.status === 204 ? null : await response.arrayBuffer(), { status: response.status, headers: response.headers.get("content-type") ? { "content-type": response.headers.get("content-type")! } : undefined });
  } catch { return new Response(null, { status: 502 }); }
}
