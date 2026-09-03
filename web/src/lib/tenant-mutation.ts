import type { TenantPaymentStatus } from "./tenants";

export type TenantMutationInput = {
  name: string;
  propertyId: string;
  unit: string;
  rent: number;
  status: TenantPaymentStatus;
};

export async function saveTenant(
  input: TenantMutationInput,
  id?: string,
): Promise<void> {
  const response = await fetch(
    id ? `/api/proxy/tenants/${encodeURIComponent(id)}` : "/api/proxy/tenants",
    {
      method: id ? "PUT" : "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(input),
    },
  );
  if (!response.ok) throw new Error(String(response.status));
}
