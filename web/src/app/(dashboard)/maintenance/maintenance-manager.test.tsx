/* @vitest-environment jsdom */
import "@testing-library/jest-dom/vitest";
import { afterEach, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { MaintenanceManager } from "./maintenance-manager";

vi.mock("next/navigation", () => ({ useRouter: () => ({ refresh: vi.fn() }) }));
afterEach(() => { cleanup(); vi.unstubAllGlobals(); vi.useRealTimers(); });
const properties = [{ id: "p", name: "House", location: "Seoul", type: "House", occupancy: "0%", status: "Active" as const }];
const tasks = [
  { id: "m1", propertyId: "p", task: "Leak", dueDate: "2026-09-04", status: "Pending" as const },
  { id: "m2", propertyId: "p", task: "Boiler", dueDate: "2026-09-01", status: "Completed" as const },
];

it("accepts the new Seoul day after the page has stayed open across midnight", async () => {
  vi.useFakeTimers({ toFake: ["Date"] });
  vi.setSystemTime(new Date("2026-09-05T14:59:00Z"));
  const fetchMock = vi.fn().mockResolvedValue(new Response("{}"));
  vi.stubGlobal("fetch", fetchMock);
  render(<MaintenanceManager items={[{ ...tasks[0], status: "InProgress" }]} properties={properties} today="2026-09-05" />);
  fireEvent.click(screen.getByRole("button", { name: "Leak 완료 처리" }));
  vi.setSystemTime(new Date("2026-09-05T15:01:00Z"));
  fireEvent.change(screen.getByLabelText("완료일"), { target: { value: "2026-09-06" } });
  fireEvent.change(screen.getByLabelText("처리 결과"), { target: { value: "Repaired" } });
  expect(screen.getByLabelText("완료일")).toHaveAttribute("max", "2026-09-06");
  fireEvent.click(screen.getByRole("button", { name: "저장" }));
  await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(1));
});

it("filters overdue tasks without including completed work", () => {
  render(<MaintenanceManager items={tasks} properties={properties} today="2026-09-05" />);
  fireEvent.change(screen.getByLabelText("상태 필터"), { target: { value: "Overdue" } });
  expect(screen.getByText("Leak")).toBeInTheDocument();
  expect(screen.queryByText("Boiler")).not.toBeInTheDocument();
});

it("registers a task through the authenticated proxy", async () => {
  const fetchMock = vi.fn().mockResolvedValue(new Response("{}", { status: 201 }));
  vi.stubGlobal("fetch", fetchMock);
  render(<MaintenanceManager items={[]} properties={properties} today="2026-09-05" />);
  fireEvent.click(screen.getByRole("button", { name: "작업 등록" }));
  fireEvent.change(screen.getByLabelText("자산"), { target: { value: "p" } });
  fireEvent.change(screen.getByLabelText("작업 내용"), { target: { value: "  Leak repair  " } });
  fireEvent.change(screen.getByLabelText("예정일"), { target: { value: "2026-09-08" } });
  fireEvent.click(screen.getByRole("button", { name: "저장" }));
  await waitFor(() => expect(fetchMock).toHaveBeenCalledWith("/api/proxy/maintenance", expect.objectContaining({ method: "POST", body: JSON.stringify({ propertyId: "p", task: "Leak repair", dueDate: "2026-09-08", status: "Pending" }) })));
});

it("starts a pending task and reports permission failures inline", async () => {
  const fetchMock = vi.fn().mockResolvedValue(new Response("{}", { status: 403 }));
  vi.stubGlobal("fetch", fetchMock);
  render(<MaintenanceManager items={tasks} properties={properties} today="2026-09-05" />);
  fireEvent.click(screen.getByRole("button", { name: "Leak 작업 시작" }));
  await waitFor(() => expect(screen.getByRole("alert")).toHaveTextContent("권한"));
  expect(fetchMock).toHaveBeenCalledWith("/api/proxy/maintenance/m1", expect.objectContaining({ method: "PUT", body: JSON.stringify({ status: "InProgress" }) }));
});

it("updates only the schedule and status supported by the API", async () => {
  const fetchMock = vi.fn().mockResolvedValue(new Response("{}"));
  vi.stubGlobal("fetch", fetchMock);
  render(<MaintenanceManager items={tasks} properties={properties} today="2026-09-05" />);
  fireEvent.click(screen.getByRole("button", { name: "Leak 일정·상태 수정" }));
  fireEvent.change(screen.getByLabelText("예정일"), { target: { value: "2026-09-10" } });
  fireEvent.change(screen.getByLabelText("상태"), { target: { value: "Scheduled" } });
  fireEvent.click(screen.getByRole("button", { name: "저장" }));
  await waitFor(() => expect(fetchMock).toHaveBeenCalledWith("/api/proxy/maintenance/m1", expect.objectContaining({ method: "PUT", body: JSON.stringify({ dueDate: "2026-09-10", status: "Scheduled" }) })));
});

it("requires saving the completion form before marking work complete", async () => {
  const fetchMock = vi.fn().mockResolvedValue(new Response("{}"));
  vi.stubGlobal("fetch", fetchMock);
  render(<MaintenanceManager items={[{ ...tasks[0], status: "InProgress" }]} properties={properties} today="2026-09-05" />);
  fireEvent.click(screen.getByRole("button", { name: "Leak 완료 처리" }));
  expect(fetchMock).not.toHaveBeenCalled();
  expect(screen.getByLabelText("상태")).toHaveValue("Completed");
  fireEvent.change(screen.getByLabelText("완료일"), { target: { value: "2026-09-03" } });
  fireEvent.change(screen.getByLabelText("처리 결과"), { target: { value: "  Valve replaced  " } });
  fireEvent.click(screen.getByRole("button", { name: "저장" }));
  await waitFor(() => expect(fetchMock).toHaveBeenCalledWith("/api/proxy/maintenance/m1", expect.objectContaining({ body: JSON.stringify({ dueDate: "2026-09-04", status: "Completed", completedAt: "2026-09-03", resolution: "Valve replaced" }) })));
});

it("keeps completion evidence when saving fails", async () => {
  vi.stubGlobal("fetch", vi.fn().mockResolvedValue(new Response("{}", { status: 400 })));
  render(<MaintenanceManager items={[{ ...tasks[0], status: "InProgress" }]} properties={properties} today="2026-09-05" />);
  fireEvent.click(screen.getByRole("button", { name: "Leak 완료 처리" }));
  fireEvent.change(screen.getByLabelText("완료일"), { target: { value: "2026-09-03" } });
  fireEvent.change(screen.getByLabelText("처리 결과"), { target: { value: "Repaired" } });
  fireEvent.click(screen.getByRole("button", { name: "저장" }));
  await waitFor(() => expect(screen.getByRole("alert")).toBeInTheDocument());
  expect(screen.getByLabelText("처리 결과")).toHaveValue("Repaired");
  expect(screen.getByLabelText("완료일")).toHaveValue("2026-09-03");
});

it("blocks repeated submissions while saving", async () => {
  let finish!: (response: Response) => void;
  const fetchMock = vi.fn(() => new Promise<Response>((resolve) => { finish = resolve; }));
  vi.stubGlobal("fetch", fetchMock);
  render(<MaintenanceManager items={tasks} properties={properties} today="2026-09-05" />);
  const start = screen.getByRole("button", { name: "Leak 작업 시작" });
  fireEvent.click(start);
  fireEvent.click(start);
  expect(fetchMock).toHaveBeenCalledTimes(1);
  expect(start).toBeDisabled();
  finish(new Response("{}"));
  await waitFor(() => expect(screen.getByRole("status")).toHaveTextContent("수정했습니다"));
});
