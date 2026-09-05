/* @vitest-environment jsdom */
import "@testing-library/jest-dom/vitest";
import { cleanup, fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { afterEach, expect, it, vi } from "vitest";
import { renderToString } from "react-dom/server";
import { ReceiptHistory } from "./receipt-history";
import { voidReceipt, BillingMutationError } from "@/lib/billing-client-mutation";

vi.mock("next/navigation", () => ({ useRouter: () => ({ refresh: vi.fn() }) }));
vi.mock("@/lib/billing-client-mutation", () => ({
  voidReceipt: vi.fn(async () => {}),
  BillingMutationError: class extends Error { constructor(readonly status: number) { super(); } },
}));
afterEach(() => { cleanup(); vi.resetAllMocks(); });

it("disables server-rendered void controls until client event handlers are ready", () => {
  const root = document.createElement("div");
  root.innerHTML = renderToString(<ReceiptHistory charges={[]} receipts={[{
    id: "receipt-1", tenantId: "tenant-1", propertyId: "property-1", amountWon: 400000,
    receivedDate: "2026-09-05", method: "BankTransfer", allocations: [],
  }]} />);
  expect(within(root).getByRole("textbox")).toBeDisabled();
  expect(within(root).getByRole("button", { name: "영수증 취소" })).toBeDisabled();
});

function openConfirmation() {
  render(<ReceiptHistory charges={[]} receipts={[{
    id: "receipt-1", tenantId: "tenant-1", propertyId: "property-1", amountWon: 400000,
    receivedDate: "2026-09-05", method: "BankTransfer", allocations: [{ chargeId: "charge-1", amountWon: 400000 }],
  }]} />);
  fireEvent.change(screen.getByRole("textbox", { name: "receipt-1 취소 사유" }), { target: { value: "중복 입금 입력" } });
  fireEvent.click(screen.getByRole("button", { name: "영수증 취소" }));
  return screen.getByRole("alertdialog");
}

it("requires themed confirmation and leaves the receipt unchanged when dismissed", () => {
  const dialog = openConfirmation();
  expect(voidReceipt).not.toHaveBeenCalled();
  expect(dialog).toHaveTextContent("receipt-1");
  expect(dialog).toHaveTextContent("₩400,000");
  expect(dialog).toHaveTextContent("중복 입금 입력");
  fireEvent.click(within(dialog).getByRole("button", { name: "돌아가기" }));
  expect(voidReceipt).not.toHaveBeenCalled();
});

it("submits only the confirmed receipt and preserves the dialog on session failure", async () => {
  vi.mocked(voidReceipt).mockRejectedValue(new BillingMutationError(401));
  const dialog = openConfirmation();
  fireEvent.click(within(dialog).getByRole("button", { name: "취소 확정" }));
  await waitFor(() => expect(voidReceipt).toHaveBeenCalledWith("receipt-1", "중복 입금 입력"));
  expect(await within(dialog).findByRole("alert")).toHaveTextContent("로그인이 만료");
  expect(dialog).toHaveTextContent("중복 입금 입력");
});

it("closes confirmation only after the requested void succeeds", async () => {
  const dialog = openConfirmation();
  fireEvent.click(within(dialog).getByRole("button", { name: "취소 확정" }));
  await waitFor(() => expect(screen.queryByRole("alertdialog")).not.toBeInTheDocument());
  expect(voidReceipt).toHaveBeenCalledTimes(1);
  expect(voidReceipt).toHaveBeenCalledWith("receipt-1", "중복 입금 입력");
});
