import { test, expect } from "@playwright/test";

test("properties dashboard renders its operational summary", async ({ page }) => {
  await page.goto("/properties");

  await expect(page.getByRole("heading", { name: "매물" })).toBeVisible();
  await expect(page.getByText("전체 자산", { exact: true })).toBeVisible();
  await expect(page.getByText("평균 점유율", { exact: true })).toBeVisible();
  await expect(page.getByText("검토 필요", { exact: true })).toBeVisible();
  await expect(page.getByText("자산 목록", { exact: true })).toBeVisible();
  await expect(page.getByText("Seoul Heights Tower", { exact: true })).toBeVisible();
  await expect(page.getByText("96%", { exact: true })).toBeVisible();
});
