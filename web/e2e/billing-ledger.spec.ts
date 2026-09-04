import { expect, test } from "@playwright/test";

const storageState = process.env.PLAYWRIGHT_AUTH_STORAGE_STATE;
const billingMonth = new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Seoul", year: "numeric", month: "2-digit" }).format(new Date()).slice(0, 7);

test.describe("monthly billing ledger", () => {
  test.skip(!storageState, "Set PLAYWRIGHT_AUTH_STORAGE_STATE to an Auth0 PropertyManager session file.");
  test.use({ storageState });

  test("shows the selected monthly ledger without relying on tenant payment status", async ({ page }) => {
    await page.goto(`/payments?billingMonth=${billingMonth}`);

    await expect(page.getByRole("heading", { name: "수납 원장" })).toBeVisible();
    await expect(page.getByText(`${billingMonth} 청구월 기준 수납과 미수 현황입니다.`)).toBeVisible();
    await expect(page.getByRole("button", { name: "수납 등록" })).toBeVisible();
  });
});
