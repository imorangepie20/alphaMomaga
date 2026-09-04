/* @vitest-environment jsdom */
import "@testing-library/jest-dom/vitest";
import { afterEach, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { ContractManager } from "./contract-manager";
vi.mock("next/navigation", () => ({ useRouter: () => ({ refresh: vi.fn() }) }));
afterEach(cleanup);
const props = {
  today: "2026-09-05",
  properties: [{ id: "p", name: "House", type: "House", location: "Seoul", occupancy: "0%", status: "Active" as const }],
  tenants: [{ id: "t", name: "Kim", propertyId: "p", unit: "101", rent: "₩100,000", status: "Paid" as const }],
  contracts: [
    { id: "c", propertyId: "p", tenantId: "t", unit: "101", monthlyRent: "₩100,000", startDate: "2026-01-01", endDate: "2026-10-05", status: "Active" as const },
    { id: "other", propertyId: "p", tenantId: "t", unit: "202", monthlyRent: "₩200,000", startDate: "2026-01-01", endDate: "2027-10-05", status: "Active" as const },
  ],
};
it("filters the list to contracts expiring within 30 days", () => {
  render(<ContractManager {...props} />);
  fireEvent.change(screen.getByLabelText("계약 상태 필터"), { target: { value: "Expiring" } });
  expect(screen.getByText("101")).toBeInTheDocument();
  expect(screen.queryByText("202")).not.toBeInTheDocument();
  expect(screen.getByText("만료까지 30일")).toBeInTheDocument();
});
it("searches by unit and reports empty results", () => {
  render(<ContractManager {...props} />);
  fireEvent.change(screen.getByLabelText("검색"), { target: { value: "missing" } });
  expect(screen.queryByText("101")).not.toBeInTheDocument();
  expect(screen.getByText("검색 조건에 맞는 계약이 없습니다.")).toBeInTheDocument();
});
