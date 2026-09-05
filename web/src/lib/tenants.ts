import { getApiUrl } from "@/lib/api-url";

export type TenantPaymentStatus = "Paid" | "Overdue" | "Pending";

export type Tenant = {
  id: string;
  name: string;
  propertyId: string;
  unit: string;
  rent: string;
  status: TenantPaymentStatus;
};

export async function getTenants(): Promise<Tenant[]> {
  const apiUrl = getApiUrl();
  if (!apiUrl) throw new Error("Tenant API is not configured");
  const response = await fetch(`${apiUrl.replace(/\/$/, "")}/tenants`, { cache: "no-store" });
  if (!response.ok) throw new Error(`Unable to read tenants: ${response.status}`);
  const data: unknown = await response.json();
  if (!Array.isArray(data)) throw new Error("Invalid tenants response");
  return data as Tenant[];
}
import { authenticatedFetch as fetch } from "./authenticated-fetch";
