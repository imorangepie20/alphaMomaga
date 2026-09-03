import { expect, test } from "@playwright/test";

test("dashboard redirects unauthenticated visitors to login", async ({ page }) => {
  await page.goto("/properties");

  await expect(page).toHaveURL(/\/login$/);
  await expect(page.getByRole("link", { name: "Continue with Auth0" })).toBeVisible();
});
