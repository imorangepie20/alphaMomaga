import { expect, it } from "vitest";
import { buildWorkQueue } from "./dashboard-work-queue";

it("excludes completed work and prioritizes urgent inspections then overdue work", () => {
  const result = buildWorkQueue([
    { id: "m", propertyId: "p", task: "누수", dueDate: "2026-09-01", status: "Pending" },
    { id: "done", propertyId: "p", task: "완료", dueDate: "2026-01-01", status: "Completed" },
  ], [
    { id: "i", propertyId: "p", type: "긴급", scheduledDate: "2026-09-10", priority: "Urgent", status: "Scheduled" },
    { id: "normal", propertyId: "p", type: "정기", scheduledDate: "2026-09-06", priority: "Routine", status: "Scheduled" },
  ], "2026-09-05");
  expect(result.map((item) => item.id)).toEqual(["inspection-i", "maintenance-m", "inspection-normal"]);
  expect(result[1].overdue).toBe(true);
});

it("does not mark today's work overdue", () => {
  expect(buildWorkQueue([{ id: "m", propertyId: "p", task: "작업", dueDate: "2026-09-05", status: "Pending" }], [], "2026-09-05")[0].overdue).toBe(false);
});
