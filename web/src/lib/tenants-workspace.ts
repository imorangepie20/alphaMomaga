import { getApiUrl } from "./api-url";
import type { Tenant } from "./tenants";
import type { Property } from "./properties";

export async function getTenantWorkspace(): Promise<{ tenants: Tenant[]; properties: Property[] }> {
  const apiUrl = getApiUrl();
  if (!apiUrl) throw new Error("Tenant API is not configured");
  const baseUrl = apiUrl.replace(/\/$/, "");
  async function read<T>(resource: string): Promise<T[]> {
    const response = await fetch(`${baseUrl}/${resource}`, { cache: "no-store" });
    if (!response.ok) throw new Error(`Unable to read ${resource}: ${response.status}`);
    const data: unknown = await response.json();
    if (!Array.isArray(data)) throw new Error(`Invalid ${resource} response`);
    return data as T[];
  }
  const [tenants, properties] = await Promise.all([read<Tenant>("tenants"), read<Property>("properties")]);
  return { tenants, properties };
}
import { authenticatedFetch as fetch } from "./authenticated-fetch";
