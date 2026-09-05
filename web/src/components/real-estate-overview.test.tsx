/* @vitest-environment jsdom */
import "@testing-library/jest-dom/vitest";
import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, expect, it, vi } from "vitest";
import { RealEstateOverview } from "./real-estate-overview";
import { getPropertyRecords } from "@/lib/property-records";
import { BillingApiError, getMonthlyCharges } from "@/lib/billing";

vi.mock("@/lib/property-records", () => ({ getPropertyRecords: vi.fn(async () => ({ properties: [], tenants: [], contracts: [], maintenance: [], inspections: [] })) }));
vi.mock("@/lib/billing", () => ({ getMonthlyCharges: vi.fn(async () => []), BillingApiError: class extends Error { constructor(public status: number) { super(); } } }));
afterEach(() => { cleanup(); vi.clearAllMocks(); });

it("renders real empty states rather than sample assets and charts", async () => {
  render(await RealEstateOverview());
  expect(screen.getByText("등록된 자산이 없습니다.")).toBeInTheDocument();
  expect(screen.getByText("미완료 유지보수·점검이 없습니다.")).toBeInTheDocument();
  expect(screen.queryByText("The Somerset")).not.toBeInTheDocument();
  expect(screen.getByRole("link", { name: "청구 확정·수납 처리" })).toHaveAttribute("href", expect.stringMatching(/^\/payments\?billingMonth=\d{4}-\d{2}$/));
});

it("keeps operations visible when billing permission is denied", async () => {
  vi.mocked(getMonthlyCharges).mockRejectedValueOnce(new BillingApiError(403));
  render(await RealEstateOverview());
  expect(screen.getByRole("alert")).toHaveTextContent("조회 권한이 없습니다");
  expect(screen.getByText("우선 처리 업무")).toBeInTheDocument();
  expect(screen.queryByText("0원")).not.toBeInTheDocument();
});

it("reports failed operations read without zero counters", async () => {
  vi.mocked(getPropertyRecords).mockRejectedValueOnce(new Error("offline"));
  render(await RealEstateOverview());
  expect(screen.getByRole("alert")).toHaveTextContent("운영 현황을 불러오지 못했습니다");
  expect(screen.queryByText("등록 자산")).not.toBeInTheDocument();
});

it("shows retrieved maintenance with its asset and workflow link", async () => {
  vi.mocked(getPropertyRecords).mockResolvedValueOnce({ properties: [{ id: "p", name: "테스트 자산", location: "서울", type: "Apartment", occupancy: "90%", status: "Active" }], tenants: [], contracts: [], inspections: [], maintenance: [{ id: "m", propertyId: "p", task: "실제 누수 보수", dueDate: "2020-01-01", status: "Pending" }] });
  render(await RealEstateOverview());
  expect(screen.getByRole("link", { name: "실제 누수 보수" })).toHaveAttribute("href", "/maintenance");
  expect(screen.getByText("기한 초과")).toBeInTheDocument();
  expect(screen.getByRole("img", { name: "테스트 자산 입력 점유율 90%" })).toBeInTheDocument();
});

it("charts confirmed billing amounts and excludes drafts", async () => {
  const month = new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Seoul", year: "numeric", month: "2-digit" }).format(new Date());
  const charge = { id: "b", propertyId: "p", tenantId: "t", contractId: "c", billingMonth: month, dueDate: `${month}-01`, baseRentWon: 100, adjustmentWon: 0, billedWon: 100, receivedWon: 40, outstandingWon: 60, status: "Overdue" as const };
  vi.mocked(getMonthlyCharges).mockResolvedValueOnce([charge, { ...charge, id: "draft", status: "Draft" }]);
  render(await RealEstateOverview());
  expect(screen.getByRole("img", { name: /청구 100원, 수납 40원, 미수 60원/ })).toBeInTheDocument();
});
