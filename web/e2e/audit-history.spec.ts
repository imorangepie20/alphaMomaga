import { expect, test } from "./authenticated-session";

test("audit history navigation follows the signed-in account permission", async ({ page }) => {
  await page.goto("/admin/audit-logs");
  const denied = page.getByRole("alert").filter({ hasText: "이 페이지를 조회할 권한이 없습니다" });
  const heading = page.getByRole("heading", { name: "변경 이력", exact: true });
  await expect(denied.or(heading)).toBeVisible();
  const canManage = await heading.isVisible();
  const link = page.locator('a[href="/admin/audit-logs"]').filter({ hasText: "변경 이력" });
  if (canManage) await expect(link).toBeVisible();
  else await expect(link).toHaveCount(0);
  await page.getByRole("button", { name: "페이지 검색", exact: true }).click();
  const option = page.getByRole("option").filter({ hasText: "변경 이력" });
  if (canManage) await expect(option).toBeVisible();
  else await expect(option).toHaveCount(0);
  console.log(`Audit browser permission: ${canManage ? "allowed" : "denied"}`);
});

test("administrator can filter audit history and recover invalid pagination", async ({ page }) => {
  await page.goto("/admin/audit-logs");
  await expect(page.getByRole("heading", { name: "변경 이력", exact: true }), "This check requires a signed-in account with user:manage.").toBeVisible();
  await page.goto("/admin/audit-logs?offset=10x");
  await expect(page.getByRole("alert").filter({ hasText: "조회 조건이 올바르지 않습니다" })).toBeVisible();
  await page.getByRole("link", { name: "조회 조건 초기화" }).click();
  await expect(page.getByRole("heading", { name: "변경 이력", exact: true })).toBeVisible();
  await page.getByLabel("대상 ID", { exact: true }).fill("audit-browser-nonexistent-record");
  await page.getByRole("button", { name: "조회", exact: true }).click();
  await expect(page.getByText("조회 조건에 해당하는 기록이 없습니다.")).toBeVisible();
  await expect(page.getByLabel("대상 ID", { exact: true })).toHaveValue("audit-browser-nonexistent-record");
});
