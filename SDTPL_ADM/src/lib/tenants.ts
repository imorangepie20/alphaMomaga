export type TenantPaymentStatus = "Paid" | "Overdue" | "Pending";

export type Tenant = {
  id: string;
  name: string;
  propertyId: string;
  unit: string;
  rent: string;
  status: TenantPaymentStatus;
};

const fallbackTenants: Tenant[] = [
  { id: "tenant-1", name: "Kim Jihoon", propertyId: "property-1", unit: "A-101", rent: "₩1,200,000", status: "Paid" },
  { id: "tenant-2", name: "Park Minseo", propertyId: "property-2", unit: "B-302", rent: "₩980,000", status: "Overdue" },
  { id: "tenant-3", name: "Lee Daeho", propertyId: "property-3", unit: "C-205", rent: "₩1,540,000", status: "Paid" },
  { id: "tenant-4", name: "Choi Yuna", propertyId: "property-4", unit: "D-408", rent: "₩1,020,000", status: "Pending" },
];

export async function getTenants(): Promise<Tenant[]> {
  const apiUrl = process.env.API_URL;

  if (!apiUrl) return fallbackTenants;

  try {
    const response = await fetch(`${apiUrl}/tenants`, { cache: "no-store" });
    if (!response.ok) return fallbackTenants;
    return (await response.json()) as Tenant[];
  } catch {
    return fallbackTenants;
  }
}