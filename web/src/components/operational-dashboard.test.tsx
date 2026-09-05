/* @vitest-environment jsdom */
import "@testing-library/jest-dom/vitest";
import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, render, screen } from "@testing-library/react";
import { OperationalDashboard } from "./operational-dashboard";
import { getContractsWorkspace } from "@/lib/contracts-workspace";
import { BillingApiError, getMonthlyCharges } from "@/lib/billing";

vi.mock("@/lib/contracts-workspace", () => ({ getContractsWorkspace: vi.fn(async () => ({ properties: [], tenants: [], contracts: [] })) }));
vi.mock("@/lib/billing", () => ({ getMonthlyCharges: vi.fn(async () => []), BillingApiError: class extends Error { constructor(public status: number) { super(); } } }));
afterEach(() => { cleanup(); vi.clearAllMocks(); });

describe("operational dashboard pages", () => {
  it.each(["", "2026-13", "0000-01", ["2026-08", "2026-09"]].map((billingMonth) => ({ billingMonth })))("rejects invalid revenue month $billingMonth without reading another month", async ({ billingMonth }) => {
    render(await OperationalDashboard({ mode: "revenue", billingMonth }));
    expect(screen.getByRole("alert")).toHaveTextContent("올바른 청구월");
    expect(getMonthlyCharges).not.toHaveBeenCalled();
    expect(getContractsWorkspace).not.toHaveBeenCalled();
    expect(screen.queryByText("확정 청구")).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "조회" })).toBeInTheDocument();
  });

  it.each(["portfolio", "occupancy"] as const)("renders honest empty state for %s without billing access", async (mode) => {
    render(await OperationalDashboard({ mode }));
    expect(screen.getByText("자산을 등록하면 운영 현황이 표시됩니다.")).toBeInTheDocument();
    expect(getMonthlyCharges).not.toHaveBeenCalled();
  });
  it("preserves selected billing month in read and ledger link", async () => {
    render(await OperationalDashboard({ mode: "revenue", billingMonth: "2026-08" }));
    expect(getMonthlyCharges).toHaveBeenCalledWith("2026-08");
    expect(screen.getByLabelText("청구월")).toHaveValue("2026-08");
    expect(screen.getByRole("link", { name: "수납 원장" })).toHaveAttribute("href", "/payments?billingMonth=2026-08");
    expect(screen.getByText("선택한 월에 확정된 청구가 없습니다.")).toBeInTheDocument();
  });
  it("shows load failure instead of fabricated zero metrics", async () => {
    vi.mocked(getContractsWorkspace).mockRejectedValueOnce(new Error("offline"));
    render(await OperationalDashboard({ mode: "portfolio" }));
    expect(screen.getByRole("alert")).toHaveTextContent("불러오지 못했습니다");
    expect(screen.queryByText("등록 자산")).not.toBeInTheDocument();
  });
  it("explains billing permission failure", async () => {
    vi.mocked(getMonthlyCharges).mockRejectedValueOnce(new BillingApiError(403));
    render(await OperationalDashboard({ mode: "revenue" }));
    expect(screen.getByRole("alert")).toHaveTextContent("조회 권한이 없습니다");
    expect(screen.queryByText("0원")).not.toBeInTheDocument();
  });
});
