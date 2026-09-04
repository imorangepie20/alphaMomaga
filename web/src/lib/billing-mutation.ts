import "server-only";

import { auth0 } from "./auth0";
import { getApiUrl } from "./api-url";

function isAllowedPath(path: string): boolean {
  return path === "payment-receipts"
    || /^monthly-charges\/[^/]+\/(approve|cancel)$/.test(path)
    || /^payment-receipts\/[^/]+\/void$/.test(path)
    || /^billing-runs\/\d{4}-\d{2}$/.test(path);
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
