import { test, expect } from "./authenticated-session";

test("properties dashboard renders its operational summary", async ({ page }) => {
  await page.goto("/properties");

  await expect(page.getByRole("heading", { name: "매물" })).toBeVisible();
  await expect(page.getByText("전체 자산", { exact: true })).toBeVisible();
  await expect(page.getByText("평균 점유율", { exact: true })).toBeVisible();
  await expect(page.getByText("이달 미수금", { exact: true })).toBeVisible();
  await expect(page.getByText("조치 필요 자산", { exact: true })).toBeVisible();
  await expect(page.getByRole("table")).toBeVisible();
});
