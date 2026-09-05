/* @vitest-environment jsdom */

import "@testing-library/jest-dom/vitest";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { ReceiptManager } from "./receipt-manager";

vi.mock("next/navigation", () => ({ useRouter: () => ({ refresh: vi.fn() }) }));

afterEach(() => { cleanup(); vi.useRealTimers(); });

describe("ReceiptManager", () => {
  it.each([
    ["2026-09-04T14:59:59Z", "2026-09-04"],
    ["2026-09-04T15:00:00Z", "2026-09-05"],
    ["2026-09-30T15:00:00Z", "2026-10-01"],
    ["2026-12-31T15:00:00Z", "2027-01-01"],
  ])("uses the Seoul receipt date at %s", (instant, expectedDate) => {
    vi.useFakeTimers({ toFake: ["Date"] });
    vi.setSystemTime(new Date(instant));
    render(<ReceiptManager charges={[{
      id: "charge-1", propertyId: "property-1", tenantId: "tenant-1", contractId: "contract-1",
      billingMonth: "2026-09", dueDate: "2026-09-05", baseRentWon: 1200000, adjustmentWon: 0,
      billedWon: 1200000, receivedWon: 0, outstandingWon: 1200000, status: "Approved",
    }]} tenantNames={{ "tenant-1": "테스트 임차인" }} />);
    fireEvent.click(screen.getByRole("button", { name: "수납 등록" }));
    expect(screen.getByLabelText("수납일")).toHaveValue(expectedDate);
    fireEvent.change(screen.getByLabelText("수납일"), { target: { value: "2026-08-15" } });
    expect(screen.getByLabelText("수납일")).toHaveValue("2026-08-15");
  });

  it("keeps the allocation form inside a viewport-bounded scrolling dialog", () => {
    render(<ReceiptManager
      charges={[{
        id: "charge-1", propertyId: "property-1", tenantId: "tenant-1", contractId: "contract-1",
        billingMonth: "2026-09", dueDate: "2026-09-05", baseRentWon: 1200000, adjustmentWon: 0,
        billedWon: 1200000, receivedWon: 0, outstandingWon: 1200000, status: "Approved",
      }]}
      tenantNames={{ "tenant-1": "Kim Jihoon · A-101" }}
    />);

    fireEvent.click(screen.getByRole("button", { name: "수납 등록" }));

    const dialog = screen.getByRole("heading", { name: "수납 등록" }).closest('[data-slot="dialog-content"]');
    expect(dialog).toHaveClass("max-h-[calc(100dvh-2rem)]", "overflow-y-auto", "sm:max-w-xl");
  });
});
