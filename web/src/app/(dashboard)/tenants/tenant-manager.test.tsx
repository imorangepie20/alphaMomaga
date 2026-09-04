/* @vitest-environment jsdom */
import "@testing-library/jest-dom/vitest";
import { afterEach, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen, within } from "@testing-library/react";
import { TenantManager } from "./tenant-manager";
import type { MonthlyCharge } from "@/lib/billing";
vi.mock("next/navigation", () => ({ useRouter: () => ({ refresh: vi.fn() }) }));
afterEach(cleanup);
const tenants = [{ id: "t", name: "Kim", propertyId: "p", unit: "101", rent: "100", status: "Paid" as const }, { id: "other", name: "Park", propertyId: "p2", unit: "201", rent: "200", status: "Paid" as const }];
const properties = [{ id: "p", name: "House", location: "Seoul", type: "House", occupancy: "0%", status: "Active" as const }, { id: "p2", name: "Tower", location: "Seoul", type: "House", occupancy: "0%", status: "Active" as const }];
const charge: MonthlyCharge = { id: "c", propertyId: "p", tenantId: "t", contractId: "k", billingMonth: "2026-09", dueDate: "2026-09-01", baseRentWon: 100, adjustmentWon: 0, billedWon: 100, receivedWon: 0, outstandingWon: 100, status: "Overdue" };

it("shows combined charges and filters tenants by status and property", () => {
  render(<TenantManager tenants={tenants} properties={properties} charges={[charge, { ...charge, id: "c2", status: "Paid", receivedWon: 100, outstandingWon: 0 }]} billingMonth="2026-09" />);
  const row = screen.getByText("Kim").closest("tr")!;
  expect(within(row).getByText("₩200")).toBeInTheDocument();
  expect(within(row).getByText("연체")).toBeInTheDocument();
  fireEvent.change(screen.getByLabelText("납부 상태 필터"), { target: { value: "NoCharge" } });
  expect(screen.queryByText("Kim")).not.toBeInTheDocument();
  expect(screen.getByText("Park")).toBeInTheDocument();
  fireEvent.change(screen.getByLabelText("자산 필터"), { target: { value: "p" } });
  expect(screen.queryByText("Park")).not.toBeInTheDocument();
});

it("opens every charge behind a tenant's total", () => {
  render(<TenantManager tenants={tenants} properties={properties} charges={[charge, { ...charge, id: "draft", dueDate: "2026-09-10", status: "Draft" }]} billingMonth="2026-09" />);
  fireEvent.click(screen.getByRole("button", { name: "Kim 청구 내역" }));
  const dialog = screen.getByRole("dialog");
  expect(within(dialog).getByText("2026-09-01")).toBeInTheDocument();
  expect(within(dialog).getByText("2026-09-10")).toBeInTheDocument();
  expect(within(dialog).getByRole("link", { name: "수납 원장 열기" })).toHaveAttribute("href", "/payments?billingMonth=2026-09");
});
