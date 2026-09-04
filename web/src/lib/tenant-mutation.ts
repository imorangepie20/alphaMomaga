export type TenantMutationInput = {
  name: string;
  propertyId: string;
  unit: string;
  rent: number;
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
      body: JSON.stringify(id
        ? { name: input.name, unit: input.unit, rent: input.rent }
        : { ...input, rent: `₩${input.rent.toLocaleString("en-US")}` }),
    },
  );
  if (!response.ok) throw new Error(String(response.status));
}
