import { expect, test } from "./authenticated-session";

const storageState = process.env.PLAYWRIGHT_AUTH_STORAGE_STATE;
const billingMonth = new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Seoul", year: "numeric", month: "2-digit" }).format(new Date()).slice(0, 7);

test.describe("monthly billing ledger", () => {
  test.use({ storageState });

  test("shows the selected monthly ledger without relying on tenant payment status", async ({ page }) => {
    await page.goto(`/payments?billingMonth=${billingMonth}`);

    await expect(page.getByRole("heading", { name: "수납 원장" })).toBeVisible();
    await expect(page.getByText(`${billingMonth} 청구월의 확정 청구 기준 수납과 미수 현황입니다. 초안·취소 금액은 합계에서 제외됩니다.`)).toBeVisible();
    await expect(page.getByRole("button", { name: "수납 등록" })).toBeVisible();
  });

  test("previews and dismisses receipt void without sending a mutation", async ({ page }) => {
    let mutations = 0;
    const clientErrors: string[] = [];
    page.on("pageerror", (error) => clientErrors.push(error.message));
    page.on("console", (message) => {
      if (message.type() === "error") clientErrors.push(message.text().slice(0, 500));
    });
    page.on("response", (response) => {
      if (new URL(response.url()).pathname.startsWith("/_next/static/") && response.status() >= 400) {
        clientErrors.push(`Client asset HTTP ${response.status()}`);
      }
    });
    await page.route("**/api/billing/**", async (route) => {
      if (route.request().method() !== "GET") { mutations += 1; await route.abort(); }
      else await route.continue();
    });
    await page.goto(`/payments?billingMonth=${billingMonth}`);
    const reason = page.getByRole("textbox", { name: /취소 사유$/ }).first();
    await page.getByRole("button", { name: "수납 등록", exact: true }).click();
    expect(clientErrors).toEqual([]);
    const receiptDialog = page.getByRole("dialog", { name: "수납 등록", exact: true });
    await expect(receiptDialog).toBeVisible();
    await receiptDialog.getByRole("button", { name: "취소", exact: true }).click();
    await expect(reason, "This read-only preview requires an existing non-voided receipt").toBeVisible();
    await reason.fill("검수 미리보기 - 저장하지 않음");
    await reason.locator("..").getByRole("button", { name: "영수증 취소", exact: true }).click();
    expect(clientErrors, "Client JavaScript must load before interaction checks").toEqual([]);
    const dialog = page.getByRole("alertdialog", { name: "영수증 취소 확인" });
    await expect(dialog).toContainText("검수 미리보기 - 저장하지 않음");
    await expect(dialog.getByRole("button", { name: "취소 확정" })).toBeVisible();
    await dialog.getByRole("button", { name: "돌아가기" }).click();
    await expect(dialog).not.toBeVisible();
    expect(mutations).toBe(0);
  });
});
