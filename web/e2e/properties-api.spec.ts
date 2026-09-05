import { test, expect, apiAuthorization } from "./authenticated-session";

const apiUrl = process.env.API_URL ?? "http://localhost:3100";

test("properties page renders records from the API", async ({ page, request }) => {
  const apiResponse = await request.get(`${apiUrl}/properties`, { headers: apiAuthorization() });
  expect(apiResponse.ok(), `GET ${apiUrl}/properties`).toBeTruthy();

  const properties = (await apiResponse.json()) as Array<{ name: string }>;
  expect(Array.isArray(properties)).toBeTruthy();

  await page.goto("/properties");
  await expect(page.getByRole("heading", { name: "매물" })).toBeVisible();
  await expect(page.getByText(String(properties.length), { exact: true }).first()).toBeVisible();

  for (const property of properties) {
    await expect(page.getByText(property.name, { exact: true })).toBeVisible();
  }
});
