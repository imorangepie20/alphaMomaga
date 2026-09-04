/* @vitest-environment jsdom */
import "@testing-library/jest-dom/vitest";
import { afterEach, expect, it, vi } from "vitest";
import { cleanup, render, screen } from "@testing-library/react";
import TenantsPage from "./page";
import { getMonthlyCharges } from "@/lib/billing";
vi.mock("@/lib/billing", () => ({ getMonthlyCharges: vi.fn(async () => []), BillingApiError: class extends Error {} }));
vi.mock("@/lib/tenants-workspace", () => ({ getTenantWorkspace: vi.fn(async () => ({ tenants: [], properties: [] })) }));
vi.mock("./tenant-manager", () => ({ TenantManager: () => null }));
afterEach(() => { cleanup(); vi.clearAllMocks(); });

it("uses a valid selected month for the query and the displayed month control", async () => {
  render(await TenantsPage({ searchParams: Promise.resolve({ billingMonth: "2025-02" }) }));
  expect(getMonthlyCharges).toHaveBeenCalledWith("2025-02");
  expect(screen.getByLabelText("청구월")).toHaveValue("2025-02");
  expect(screen.queryByRole("status")).not.toBeInTheDocument();
});

it("does not send an invalid calendar month to billing", async () => {
  render(await TenantsPage({ searchParams: Promise.resolve({ billingMonth: "2026-13" }) }));
  expect(getMonthlyCharges).not.toHaveBeenCalledWith("2026-13");
  expect(screen.getByRole("status")).toHaveTextContent("청구월 형식");
});
