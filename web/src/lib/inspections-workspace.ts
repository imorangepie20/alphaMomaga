import { getApiUrl } from "./api-url";
import type { Inspection } from "./inspections";
import type { Property } from "./properties";

export async function getInspectionWorkspace(): Promise<{ items: Inspection[]; properties: Property[] }> {
  const apiUrl = getApiUrl();
  if (!apiUrl) throw new Error("Inspection API is not configured");
  const baseUrl = apiUrl.replace(/\/$/, "");
  async function read<T>(resource: string): Promise<T[]> {
    const response = await fetch(`${baseUrl}/${resource}`, { cache: "no-store" });
    if (!response.ok) throw new Error(`Unable to read ${resource}: ${response.status}`);
    const data: unknown = await response.json();
    if (!Array.isArray(data)) throw new Error(`Invalid ${resource} response`);
    return data as T[];
  }
  const [items, properties] = await Promise.all([read<Inspection>("inspections"), read<Property>("properties")]);
  return { items, properties };
}
import { authenticatedFetch as fetch } from "./authenticated-fetch";
