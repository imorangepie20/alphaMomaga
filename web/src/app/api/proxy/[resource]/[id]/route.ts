import { forwardProtectedMutation, isProtectedResource } from "@/lib/protected-api";

interface ProxyItemRouteContext {
  params: Promise<{ resource: string; id: string }>;
}

async function handleItemMutation(request: Request, context: ProxyItemRouteContext): Promise<Response> {
  const { resource, id } = await context.params;

  if (!isProtectedResource(resource) || !id) {
    return new Response(null, { status: 404 });
  }

  return forwardProtectedMutation(resource, request, id);
}

export const PUT = handleItemMutation;
export const DELETE = handleItemMutation;
