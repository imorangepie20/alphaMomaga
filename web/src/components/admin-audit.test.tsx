/* @vitest-environment jsdom */
import "@testing-library/jest-dom/vitest";
import { afterEach, expect, it, vi } from "vitest";
import { cleanup, render, screen } from "@testing-library/react";
import { AdminAudit } from "./admin-audit";
import { getAdminAccess, AdminAccessError } from "@/lib/admin-access";
import { getAuditLogs } from "@/lib/audit-logs";

vi.mock("@/lib/admin-access", () => ({ getAdminAccess: vi.fn(async () => ({})), AdminAccessError: class extends Error { constructor(public status: number) { super(); } } }));
vi.mock("@/lib/audit-logs", () => ({ getAuditLogs: vi.fn(async () => []) }));
afterEach(() => { cleanup(); vi.clearAllMocks(); });

it("does not query audit data when access is denied", async () => {
  vi.mocked(getAdminAccess).mockRejectedValueOnce(new AdminAccessError(403));
  render(await AdminAudit({ searchParams: {} }));
  expect(screen.getByRole("alert")).toHaveTextContent("권한이 없습니다");
  expect(getAuditLogs).not.toHaveBeenCalled();
});

it("filters records and exposes previous completion evidence", async () => {
  vi.mocked(getAuditLogs).mockResolvedValueOnce([{ id: "audit-test", action: "inspection.updated", actorSubject: "auth0|test", actorRole: "Admin", entityType: "inspection", entityId: "inspection-test", createdAt: "2026-09-05T00:00:00Z", metadata: { changes: { status: "InReview" }, previousCompletion: { completedAt: "2026-09-01", result: "Alarm verified" } } }]);
  render(await AdminAudit({ searchParams: { entityType: "inspection", entityId: "inspection-test" } }));
  expect(getAdminAccess).toHaveBeenCalledWith("user:manage");
  expect(getAuditLogs).toHaveBeenCalledWith(expect.objectContaining({ entityType: "inspection", entityId: "inspection-test", offset: 0, limit: 51 }));
  expect(screen.getByText(/Alarm verified/)).toBeInTheDocument();
  expect(screen.getByText("auth0|test")).toBeInTheDocument();
  expect(screen.queryByRole("link", { name: "다음" })).not.toBeInTheDocument();
});

it("rejects ambiguous filters before reading logs", async () => {
  render(await AdminAudit({ searchParams: { offset: ["0", "50"] } }));
  expect(screen.getByRole("alert")).toHaveTextContent("조회 조건");
  expect(getAuditLogs).not.toHaveBeenCalled();
});

it("preserves filters when paging without pretending to know the total", async () => {
  vi.mocked(getAuditLogs).mockResolvedValueOnce(Array.from({ length: 51 }, (_, i) => ({ id: `a-${i}`, action: "inspection.updated", actorSubject: "actor", actorRole: "Admin", entityType: "inspection", entityId: `i-${i}`, createdAt: "2026-09-05T00:00:00Z" })));
  render(await AdminAudit({ searchParams: { entityType: "inspection", offset: "50" } }));
  expect(screen.getByRole("link", { name: "다음" })).toHaveAttribute("href", "/admin/audit-logs?entityType=inspection&offset=100");
  expect(screen.getByRole("link", { name: "이전" })).toHaveAttribute("href", "/admin/audit-logs?entityType=inspection&offset=0");
  expect(screen.getAllByText("actor")).toHaveLength(50);
});
