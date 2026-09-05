import { expect, test } from "@playwright/test";

for (const route of ["/properties", "/tenants", "/contracts", "/payments", "/maintenance", "/inspections", "/admin/users", "/admin/roles", "/admin/reports", "/settings"]) {
test(`${route} redirects unauthenticated visitors to login`, async ({ page }) => {
  await page.goto(route);

  await expect(page).toHaveURL(/\/login$/);
  await expect(page.getByRole("link", { name: "Continue with Auth0" })).toBeVisible();
});
}
