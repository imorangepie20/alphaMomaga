import { test, expect } from "@playwright/test";

const apiUrl = process.env.API_URL ?? "https://api.approid.team";

test("properties page renders the public API property records", async ({ page, request }) => {
  const apiResponse = await request.get(`${apiUrl}/properties`);
  expect(apiResponse.ok(), `GET ${apiUrl}/properties`).toBeTruthy();

  const properties = (await apiResponse.json()) as Array<{ name: string }>;
  expect(properties.length).toBeGreaterThan(0);

  await page.goto("/properties");
  await expect(page.getByRole("heading", { name: "매물" })).toBeVisible();
  await expect(page.getByText(String(properties.length), { exact: true }).first()).toBeVisible();

  for (const property of properties) {
    await expect(page.getByText(property.name, { exact: true })).toBeVisible();
  }
});
