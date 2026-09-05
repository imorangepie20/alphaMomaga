import { getApiUrl } from "./api-url";
import type { Property } from "./properties";
import type { Tenant } from "./tenants";
import type { Contract } from "./contracts";
import type { Maintenance } from "./maintenance";
import type { Inspection } from "./inspections";

export async function getPropertyRecords() {
  const apiUrl = getApiUrl();
  if (!apiUrl) throw new Error("Property operations API is not configured");

  async function read<T>(resource: string): Promise<T[]> {
    const response = await fetch(`${apiUrl!.replace(/\/$/, "")}/${resource}`, { cache: "no-store" });
    if (!response.ok) throw new Error(`Unable to read ${resource}: ${response.status}`);
    const records: unknown = await response.json();
    if (!Array.isArray(records)) throw new Error(`Invalid ${resource} response`);
    return records as T[];
  }

  const [properties, tenants, contracts, maintenance, inspections] = await Promise.all([
    read<Property>("properties"), read<Tenant>("tenants"), read<Contract>("contracts"),
    read<Maintenance>("maintenance"), read<Inspection>("inspections"),
  ]);
  return { properties, tenants, contracts, maintenance, inspections };
}
import { authenticatedFetch as fetch } from "./authenticated-fetch";
