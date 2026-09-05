import { expect, test } from "./authenticated-session";

test("revenue rejects ambiguous months and allows selecting a valid period", async ({ page }) => {
  await page.goto("/dashboard/revenue?billingMonth=2026-08&billingMonth=2026-09");
  await expect(page.getByRole("alert")).toContainText("올바른 청구월");
  await expect(page.getByText("확정 청구", { exact: true })).toHaveCount(0);
  await page.getByLabel("청구월", { exact: true }).fill("2026-08");
  await page.getByRole("button", { name: "조회", exact: true }).click();
  await expect(page).toHaveURL(/\/dashboard\/revenue\?billingMonth=2026-08$/);
  await expect(page.getByText("2026-08 청구월 기준 · 확정 청구와 수납 배분 현황")).toBeVisible();
});
