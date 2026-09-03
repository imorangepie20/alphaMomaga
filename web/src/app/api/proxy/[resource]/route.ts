import { forwardProtectedMutation, isProtectedResource } from "@/lib/protected-api";

interface ProxyRouteContext {
  params: Promise<{ resource: string }>;
}

async function handleMutation(request: Request, context: ProxyRouteContext): Promise<Response> {
  const { resource } = await context.params;

  if (!isProtectedResource(resource)) {
    return new Response(null, { status: 404 });
  }

  return forwardProtectedMutation(resource, request);
}

export const POST = handleMutation;
export const PUT = handleMutation;
export const DELETE = handleMutation;
