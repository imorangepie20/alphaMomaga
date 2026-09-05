/* @vitest-environment jsdom */
import "@testing-library/jest-dom/vitest";
import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, expect, it, vi } from "vitest";
import { AdminAccountPage } from "./admin-account-pages";
import { AdminReport } from "./admin-report";
import { AdminAccessError, getAdminAccess } from "@/lib/admin-access";
import { getMonthlyCharges } from "@/lib/billing";

vi.mock("@/lib/require-session", () => ({ requireSession: async () => ({ user: { name: "실제 관리자", email: "admin@example.test" } }) }));
vi.mock("@/lib/admin-access", () => ({ AdminAccessError: class extends Error { constructor(public status: number) { super(); } }, getAdminAccess: vi.fn(async () => ({ principal: { role: "Admin", subject: "user" }, role: { name: "Admin", permissions: ["user:manage", "report:read", "billing:manage"] }, roles: [{ name: "Admin", permissions: ["user:manage", "report:read", "billing:manage"] }] })) }));
vi.mock("@/lib/billing", () => ({ BillingApiError: class extends Error {}, getMonthlyCharges: vi.fn(async () => []) }));
vi.mock("@/lib/contracts-workspace", () => ({ getContractsWorkspace: async () => ({ properties: [], tenants: [], contracts: [] }) }));
afterEach(() => { cleanup(); vi.clearAllMocks(); });

it.each(["", "2026-13", "0000-01", ["2026-08", "2026-09"]].map((billingMonth) => ({ billingMonth })))("rejects invalid report month $billingMonth without offering an export", async ({ billingMonth }) => {
  render(await AdminReport({ billingMonth }));
  expect(getAdminAccess).toHaveBeenCalledWith("report:read");
  expect(screen.getByRole("alert")).toHaveTextContent("올바른 청구월");
  expect(getMonthlyCharges).not.toHaveBeenCalled();
  expect(screen.queryByRole("button", { name: "CSV 다운로드" })).not.toBeInTheDocument();
  expect(screen.getByRole("button", { name: "조회" })).toBeInTheDocument();
});

it("shows current identity without fabricated employee accounts", async () => {
  render(await AdminAccountPage({ mode: "users" }));
  expect(screen.getByText("실제 관리자")).toBeInTheDocument();
  expect(screen.queryByText("Alicia Park")).not.toBeInTheDocument();
  expect(getAdminAccess).toHaveBeenCalledWith("user:manage");
});
it("renders billing permission in the actual role matrix", async () => {
  render(await AdminAccountPage({ mode: "roles" }));
  expect(screen.getByText("청구 관리")).toBeInTheDocument();
  expect(screen.getByText("역할별 권한 비교")).toBeInTheDocument();
});
it("settings exposes applied configuration without pretend save buttons", async () => {
  render(await AdminAccountPage({ mode: "settings" }));
  expect(screen.getByText("Asia/Seoul (서울)")).toBeInTheDocument();
  expect(screen.queryByRole("button", { name: /Save|저장/ })).not.toBeInTheDocument();
});
it("checks report permission and selected month before rendering exports", async () => {
  render(await AdminReport({ billingMonth: "2026-08" }));
  expect(getAdminAccess).toHaveBeenCalledWith("report:read");
  expect(getMonthlyCharges).toHaveBeenCalledWith("2026-08");
  expect(screen.getByRole("button", { name: "CSV 다운로드" })).toBeInTheDocument();
});
it("does not load reports or expose export when permission fails", async () => {
  vi.mocked(getAdminAccess).mockRejectedValueOnce(new AdminAccessError(403));
  render(await AdminReport({ billingMonth: "2026-08" }));
  expect(screen.getByRole("alert")).toHaveTextContent("권한이 없습니다");
  expect(getMonthlyCharges).not.toHaveBeenCalled();
  expect(screen.queryByRole("button", { name: "CSV 다운로드" })).not.toBeInTheDocument();
});
