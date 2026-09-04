/* @vitest-environment jsdom */

import "@testing-library/jest-dom/vitest";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { ChargeActions } from "./charge-actions";
import { approveCharge, BillingMutationError } from "@/lib/billing-client-mutation";

const refresh = vi.fn();

vi.mock("next/navigation", () => ({ useRouter: () => ({ refresh }) }));
vi.mock("@/lib/billing-client-mutation", () => ({
  approveCharge: vi.fn(),
  cancelCharge: vi.fn(),
  BillingMutationError: class BillingMutationError extends Error {
    constructor(readonly status: number) { super(`Billing mutation failed with status ${status}`); }
  },
}));

describe("ChargeActions", () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  it("refreshes the ledger instead of throwing when another request already approved the charge", async () => {
    vi.mocked(approveCharge).mockRejectedValue(new BillingMutationError(400));
    render(<ChargeActions charge={{
      id: "charge-1", propertyId: "property-1", tenantId: "tenant-1", contractId: "contract-1",
      billingMonth: "2026-09", dueDate: "2026-09-05", baseRentWon: 1200000, adjustmentWon: 0,
      billedWon: 1200000, receivedWon: 0, outstandingWon: 1200000, status: "Draft",
    }} />);

    fireEvent.click(screen.getByRole("button", { name: "청구 확정" }));

    await waitFor(() => expect(refresh).toHaveBeenCalledOnce());
    expect(screen.getByRole("alert")).toHaveTextContent("청구 상태가 이미 변경되어 원장을 새로고침했습니다.");
  });
});
