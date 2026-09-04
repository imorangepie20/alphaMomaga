/* @vitest-environment jsdom */

import "@testing-library/jest-dom/vitest";
import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { ReceiptManager } from "./receipt-manager";

vi.mock("next/navigation", () => ({ useRouter: () => ({ refresh: vi.fn() }) }));

describe("ReceiptManager", () => {
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
