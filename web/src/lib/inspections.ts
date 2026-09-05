import { getApiUrl } from "@/lib/api-url";

export type InspectionStatus = "Pending" | "Scheduled" | "InReview" | "Completed";
export type Inspection = { id: string; propertyId: string; type: string; scheduledDate: string; status: InspectionStatus; priority: "Routine" | "Urgent"; completedAt?: string };

const fallbackInspections: Inspection[] = [
  { id: "inspection-1", propertyId: "property-1", type: "소방 안전", scheduledDate: "2026-09-06", status: "Scheduled", priority: "Routine" },
  { id: "inspection-2", propertyId: "property-2", type: "냉난방 설비", scheduledDate: "2026-08-09", status: "Completed", priority: "Routine", completedAt: "2026-08-10" },
  { id: "inspection-3", propertyId: "property-4", type: "전기 안전", scheduledDate: "2026-09-12", status: "InReview", priority: "Urgent" },
  { id: "inspection-4", propertyId: "property-3", type: "외벽 점검", scheduledDate: "2026-09-18", status: "Pending", priority: "Routine" },
];

export async function getInspections(): Promise<Inspection[]> {
  const apiUrl = getApiUrl();
  if (!apiUrl) return fallbackInspections;
  try {
    const response = await fetch(`${apiUrl}/inspections`, { cache: "no-store" });
    if (!response.ok) return fallbackInspections;
    return (await response.json()) as Inspection[];
  } catch { return fallbackInspections; }
}
import { authenticatedFetch as fetch } from "./authenticated-fetch";
