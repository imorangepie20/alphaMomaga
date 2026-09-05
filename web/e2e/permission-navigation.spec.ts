import { expect, test } from "./authenticated-session";

test("user-management navigation matches actual page permission", async ({ page }) => {
  await page.goto("/admin/users");
  const denied = page.getByRole("alert").filter({ hasText: "이 페이지를 조회할 권한이 없습니다" });
  await expect(denied.or(page.getByRole("heading", { name: "사용자 관리", exact: true }))).toBeVisible();
  const canManage = !(await denied.isVisible());
  const userLink = page.locator('a[href="/admin/users"]');
  if (canManage) await expect(userLink).toBeVisible();
  else await expect(userLink).toHaveCount(0);
  await page.getByRole("button", { name: "페이지 검색", exact: true }).click();
  await expect(page.getByRole("dialog", { name: "페이지 검색" })).toBeVisible();
  const userOption = page.getByRole("option").filter({ hasText: "사용자" });
  if (canManage) await expect(userOption).toBeVisible();
  else await expect(userOption).toHaveCount(0);
  await page.keyboard.press("Escape");
});
