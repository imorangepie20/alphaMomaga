/* @vitest-environment jsdom */
import "@testing-library/jest-dom/vitest";
import { afterEach, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { InspectionManager } from "./inspection-manager";
vi.mock("next/navigation", () => ({ useRouter: () => ({ refresh: vi.fn() }) }));
afterEach(() => { cleanup(); vi.unstubAllGlobals(); vi.useRealTimers(); });
const properties = [{ id: "p", name: "House", location: "Seoul", type: "House", occupancy: "0%", status: "Active" as const }];
const item = { id: "i", propertyId: "p", type: "Fire safety", scheduledDate: "2026-09-01", status: "InReview" as const, priority: "Urgent" as const };

it("allows early completion on the new Seoul day without assuming a completion date", async () => {
  vi.useFakeTimers({ toFake: ["Date"] });
  vi.setSystemTime(new Date("2026-09-05T15:05:00Z"));
  const fetchMock = vi.fn().mockResolvedValue(new Response("{}")); vi.stubGlobal("fetch", fetchMock);
  render(<InspectionManager items={[{ ...item, scheduledDate: "2026-09-10" }]} properties={properties} today="2026-09-05" />);
  fireEvent.click(screen.getByRole("button", { name: "Fire safety 완료 처리" }));
  const date = screen.getByLabelText("완료일");
  expect(date).toHaveValue("");
  expect(date).not.toHaveAttribute("min");
  expect(date).toHaveAttribute("max", "2026-09-06");
  fireEvent.change(date, { target: { value: "2026-09-06" } });
  fireEvent.change(screen.getByLabelText("점검 결과"), { target: { value: "Alarm verified" } });
  fireEvent.click(screen.getByRole("button", { name: "저장" }));
  await waitFor(() => expect(fetchMock).toHaveBeenCalledWith("/api/proxy/inspections/i", expect.objectContaining({ body: JSON.stringify({ scheduledDate: "2026-09-10", priority: "Urgent", status: "Completed", completedAt: "2026-09-06", result: "Alarm verified" }) })));
});

it("registers a pending inspection with the chosen priority", async () => {
  const fetchMock = vi.fn().mockResolvedValue(new Response("{}")); vi.stubGlobal("fetch", fetchMock);
  render(<InspectionManager items={[]} properties={properties} today="2026-09-05" />);
  fireEvent.click(screen.getByRole("button", { name: "점검 등록" }));
  fireEvent.change(screen.getByLabelText("자산"), { target: { value: "p" } });
  fireEvent.change(screen.getByLabelText("점검 유형"), { target: { value: "Fire safety" } });
  fireEvent.change(screen.getByLabelText("예정일"), { target: { value: "2026-09-06" } });
  fireEvent.change(screen.getByLabelText("긴급도"), { target: { value: "Urgent" } });
  fireEvent.click(screen.getByRole("button", { name: "저장" }));
  await waitFor(() => expect(fetchMock).toHaveBeenCalledWith("/api/proxy/inspections", expect.objectContaining({ method: "POST", body: JSON.stringify({ propertyId: "p", type: "Fire safety", scheduledDate: "2026-09-06", status: "Pending", priority: "Urgent" }) })));
});

it("sends the actual completion date after confirmation", async () => {
  const fetchMock = vi.fn().mockResolvedValue(new Response("{}")); vi.stubGlobal("fetch", fetchMock);
  render(<InspectionManager items={[item]} properties={properties} today="2026-09-05" />);
  fireEvent.click(screen.getByRole("button", { name: "Fire safety 완료 처리" }));
  expect(fetchMock).not.toHaveBeenCalled();
  fireEvent.change(screen.getByLabelText("완료일"), { target: { value: "2026-09-04" } });
  expect(screen.getByLabelText("점검 결과")).toBeRequired();
  fireEvent.change(screen.getByLabelText("점검 결과"), { target: { value: "Alarm verified" } });
  fireEvent.click(screen.getByRole("button", { name: "저장" }));
  await waitFor(() => expect(fetchMock).toHaveBeenCalledWith("/api/proxy/inspections/i", expect.objectContaining({ method: "PUT", body: JSON.stringify({ scheduledDate: "2026-09-01", priority: "Urgent", status: "Completed", completedAt: "2026-09-04", result: "Alarm verified" }) })));
});

it("filters overdue and urgent work and keeps completion out of overdue counts", () => {
  render(<InspectionManager items={[item, { ...item, id: "done", type: "Finished", status: "Completed", completedAt: "2026-09-03" }]} properties={properties} today="2026-09-05" />);
  expect(screen.getByText("점검 결과 기록 없음")).toBeInTheDocument();
  fireEvent.change(screen.getByLabelText("상태 필터"), { target: { value: "Overdue" } });
  expect(screen.getByText("Fire safety")).toBeInTheDocument();
  expect(screen.queryByText("Finished")).not.toBeInTheDocument();
  fireEvent.change(screen.getByLabelText("긴급도 필터"), { target: { value: "Routine" } });
  expect(screen.queryByText("Fire safety")).not.toBeInTheDocument();
});

it("keeps completion evidence in the dialog when saving fails", async () => {
  vi.useFakeTimers({ toFake: ["Date"] });
  vi.setSystemTime(new Date("2026-09-05T03:00:00Z"));
  vi.stubGlobal("fetch", vi.fn().mockResolvedValue(new Response("{}", { status: 400 })));
  render(<InspectionManager items={[item]} properties={properties} today="2026-09-05" />);
  fireEvent.click(screen.getByRole("button", { name: "Fire safety 완료 처리" }));
  fireEvent.change(screen.getByLabelText("완료일"), { target: { value: "2026-09-04" } });
  fireEvent.change(screen.getByLabelText("점검 결과"), { target: { value: "Safety verified" } });
  fireEvent.click(screen.getByRole("button", { name: "저장" }));
  await waitFor(() => expect(screen.getByRole("alert")).toBeVisible());
  expect(screen.getByLabelText("점검 결과")).toHaveValue("Safety verified");
  expect(screen.getByLabelText("완료일")).toHaveValue("2026-09-04");
  expect(screen.getByRole("button", { name: "저장" })).toBeEnabled();
});
