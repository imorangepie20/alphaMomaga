import type { Maintenance } from "./maintenance";
import type { Inspection } from "./inspections";

export function buildWorkQueue(maintenance: Maintenance[], inspections: Inspection[], today: string) {
  return [
    ...maintenance.filter((item) => item.status !== "Completed").map((item) => ({
      id: `maintenance-${item.id}`, propertyId: item.propertyId, title: item.task,
      date: item.dueDate, urgent: false, overdue: item.dueDate < today, href: "/maintenance", kind: "유지보수",
    })),
    ...inspections.filter((item) => item.status !== "Completed").map((item) => ({
      id: `inspection-${item.id}`, propertyId: item.propertyId, title: item.type,
      date: item.scheduledDate, urgent: item.priority === "Urgent", overdue: item.scheduledDate < today, href: "/inspections", kind: "점검",
    })),
  ].sort((a, b) => Number(b.urgent) - Number(a.urgent) || Number(b.overdue) - Number(a.overdue) || a.date.localeCompare(b.date) || a.id.localeCompare(b.id));
}
