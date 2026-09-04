/* @vitest-environment jsdom */

import "@testing-library/jest-dom/vitest";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { BillingRunAction } from "./billing-run-action";
import { generateBillingRun } from "@/lib/billing-client-mutation";

const refresh = vi.fn();

vi.mock("next/navigation", () => ({ useRouter: () => ({ refresh }) }));
vi.mock("@/lib/billing-client-mutation", () => ({ generateBillingRun: vi.fn(), BillingMutationError: class BillingMutationError extends Error {} }));

describe("BillingRunAction", () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  it("generates draft charges for the selected billing month and refreshes the ledger", async () => {
    vi.mocked(generateBillingRun).mockResolvedValue();
    render(<BillingRunAction billingMonth="2026-09" />);

    fireEvent.click(screen.getByRole("button", { name: "청구 초안 생성" }));

    await waitFor(() => expect(generateBillingRun).toHaveBeenCalledWith("2026-09"));
    expect(refresh).toHaveBeenCalledOnce();
  });
});
