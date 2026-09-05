import { getApiUrl } from "@/lib/api-url";

export type MaintenanceStatus = "Pending" | "Scheduled" | "InProgress" | "Completed";
export type Maintenance = { id: string; propertyId: string; task: string; dueDate: string; status: MaintenanceStatus; completedAt?: string; resolution?: string };

const fallbackMaintenance: Maintenance[] = [
  { id: "maintenance-1", propertyId: "property-1", task: "승강기 정기 점검", dueDate: "2026-09-07", status: "Scheduled" },
  { id: "maintenance-2", propertyId: "property-2", task: "누수 보수", dueDate: "2026-09-09", status: "InProgress" },
  { id: "maintenance-3", propertyId: "property-4", task: "냉난방기 정비", dueDate: "2026-08-14", status: "Completed" },
  { id: "maintenance-4", propertyId: "property-3", task: "외벽 상태 점검", dueDate: "2026-09-22", status: "Pending" },
];

export async function getMaintenance(): Promise<Maintenance[]> {
  const apiUrl = getApiUrl();
  if (!apiUrl) return fallbackMaintenance;
  try {
    const response = await fetch(`${apiUrl}/maintenance`, { cache: "no-store" });
    if (!response.ok) return fallbackMaintenance;
    return (await response.json()) as Maintenance[];
  } catch { return fallbackMaintenance; }
}
import { authenticatedFetch as fetch } from "./authenticated-fetch";
