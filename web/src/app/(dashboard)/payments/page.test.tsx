/* @vitest-environment jsdom */
import "@testing-library/jest-dom/vitest";
import { afterEach, expect, it, vi } from "vitest";
import { cleanup, render, screen } from "@testing-library/react";
import PaymentsPage from "./page";

vi.mock("@/lib/billing", () => ({
  getBillingSummary: vi.fn(async () => ({ billedWon: 0, receivedWon: 0, outstandingWon: 0 })),
  getMonthlyCharges: vi.fn(async () => []),
  getPaymentReceipts: vi.fn(async () => []),
  BillingApiError: class extends Error {},
}));
vi.mock("@/lib/tenants", () => ({ getTenants: vi.fn(async () => { throw new Error("Unable to read tenants: 503"); }) }));
vi.mock("./receipt-manager", () => ({ ReceiptManager: () => <button>수납 등록</button> }));
vi.mock("./charge-actions", () => ({ ChargeActions: () => null }));
vi.mock("./receipt-history", () => ({ ReceiptHistory: () => null }));
vi.mock("./billing-month-selector", () => ({ BillingMonthSelector: () => null }));
vi.mock("./billing-run-action", () => ({ BillingRunAction: () => null }));

afterEach(cleanup);

it("shows a load error and no receipt form when the tenant directory is unavailable", async () => {
  render(await PaymentsPage({ searchParams: Promise.resolve({ billingMonth: "2026-09" }) }));
  expect(screen.getByRole("alert")).toHaveTextContent("수납 원장을 불러오지 못했습니다");
  expect(screen.queryByRole("button", { name: "수납 등록" })).not.toBeInTheDocument();
  expect(screen.queryByText("Kim Jihoon")).not.toBeInTheDocument();
});
