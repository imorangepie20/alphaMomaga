import "server-only";

import { auth0 } from "./auth0";
import { getApiUrl } from "./api-url";

const protectedResources = [
  "properties",
  "tenants",
  "contracts",
  "payments",
  "maintenance",
  "inspections",
] as const;

const allowedMethods = new Set(["POST", "PUT", "DELETE"]);

export type ProtectedResource = (typeof protectedResources)[number];

export function isProtectedResource(resource: string): resource is ProtectedResource {
  return protectedResources.includes(resource as ProtectedResource);
}

export async function forwardProtectedMutation(
  resource: ProtectedResource,
  request: Request,
  id?: string,
): Promise<Response> {
  if (!allowedMethods.has(request.method)) {
    return new Response(null, { status: 405, headers: { allow: "POST, PUT, DELETE" } });
  }

  const apiUrl = getApiUrl();
  if (!apiUrl) {
    return new Response(null, { status: 503 });
  }

  let token: string;
  try {
    token = (await auth0.getAccessToken()).token;
  } catch {
    return new Response(null, { status: 401 });
  }

  const headers = new Headers({ authorization: `Bearer ${token}` });
  const contentType = request.headers.get("content-type");
  if (contentType) {
    headers.set("content-type", contentType);
  }

  try {
    const path = id ? `${resource}/${encodeURIComponent(id)}` : resource;
    const response = await fetch(new URL(path, `${apiUrl.replace(/\/$/, "")}/`), {
      method: request.method,
      headers,
      body: request.method === "DELETE" ? undefined : await request.arrayBuffer(),
      cache: "no-store",
    });
    const responseContentType = response.headers.get("content-type");
    const responseBody = [204, 205, 304].includes(response.status)
      ? null
      : await response.arrayBuffer();

    return new Response(responseBody, {
      status: response.status,
      headers: responseContentType ? { "content-type": responseContentType } : undefined,
    });
  } catch {
    return new Response(null, { status: 502 });
  }
}
