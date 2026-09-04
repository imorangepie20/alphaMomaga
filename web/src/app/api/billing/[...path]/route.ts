import { forwardBillingMutation } from "@/lib/billing-mutation";

type RouteContext = { params: Promise<{ path: string[] }> };

export async function POST(request: Request, { params }: RouteContext): Promise<Response> {
  return forwardBillingMutation((await params).path.join("/"), request);
}
