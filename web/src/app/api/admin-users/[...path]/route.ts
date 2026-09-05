import { auth0 } from "@/lib/auth0";
import { getApiUrl } from "@/lib/api-url";

export async function POST(request: Request, { params }: { params: Promise<{ path: string[] }> }) {
  const { path } = await params;
  if (!(path.length === 1 && path[0] === "invite") && !(path.length === 2 && ["block", "role"].includes(path[1]) && path[0].length <= 256)) return new Response(null, { status: 404 });
  const origin = request.headers.get("origin");
  const expectedOrigin = new URL(process.env.APP_BASE_URL || request.url).origin;
  if (!origin || origin !== expectedOrigin) return new Response(null, { status: 403 });
  const base = getApiUrl();
  if (!base) return new Response(null, { status: 503 });
  let token: string;
  try { token = (await auth0.getAccessToken()).token; } catch { return new Response(null, { status: 401 }); }
  try {
    const body = await request.text();
    if (body.length > 4096) return new Response(null, { status: 413 });
    const response = await fetch(`${base.replace(/\/$/, "")}/admin/users/${path.map(encodeURIComponent).join("/")}`, { method: "POST", headers: { authorization: `Bearer ${token}`, "content-type": "application/json" }, body, cache: "no-store" });
    return new Response(await response.text(), { status: response.status, headers: { "content-type": "application/json", "cache-control": "no-store" } });
  } catch { return Response.json({ message: "계정 변경 결과를 확인할 수 없습니다. 다시 조회해 주세요." }, { status: 502 }); }
}
