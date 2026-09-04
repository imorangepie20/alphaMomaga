import { forwardProtectedMutation } from "@/lib/protected-api";

interface ContractRenewalRouteContext {
  params: Promise<{ id: string }>;
}

export async function POST(
  request: Request,
  context: ContractRenewalRouteContext,
): Promise<Response> {
  const { id } = await context.params;

  if (!id) {
    return new Response(null, { status: 404 });
  }

  return forwardProtectedMutation("contracts", request, id, "renew");
}
