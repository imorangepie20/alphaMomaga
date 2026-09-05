import { expect, test } from "@playwright/test";
test("offers real signup and serves a multi-size application favicon", async ({ page, request }) => {
  await page.goto("/register");
  await expect(page.getByRole("link", { name: "Auth0에서 안전하게 회원가입" })).toHaveAttribute("href", "/auth/login?screen_hint=signup&returnTo=%2Fpending-approval");
  const response = await request.get("/favicon.ico");
  expect(response.ok()).toBe(true);
  const body = await response.body();
  expect(body.readUInt16LE(2)).toBe(1);
  expect(body.readUInt16LE(4)).toBe(3);
});
