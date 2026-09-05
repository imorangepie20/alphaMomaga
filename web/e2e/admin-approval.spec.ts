import { expect, test } from "./authenticated-session";

test("admin can inspect approval states without changing accounts", async ({ page }) => {
  let writes = 0;
  await page.route("**/api/**", async (route) => {
    if (!["GET", "HEAD"].includes(route.request().method())) { writes++; await route.abort(); }
    else await route.continue();
  });
  await page.goto("/admin/users");
  await expect(page.getByRole("columnheader", { name: "업무 승인", exact: true }), "This check requires an authenticated Admin account; do not elevate an operational account for testing.").toBeVisible();
  await page.getByLabel("업무 승인 필터").selectOption("pending");
  await expect(page.getByRole("table").getByText("역할 부여됨", { exact: true })).toHaveCount(0);
  await expect(page.getByRole("table").getByText("역할 검토 필요", { exact: true })).toHaveCount(0);
  await expect(page.getByText(/필터는 이 페이지에만 적용됩니다/)).toBeVisible();
  await page.getByLabel("업무 승인 필터").selectOption("");
  expect(writes).toBe(0);
});
