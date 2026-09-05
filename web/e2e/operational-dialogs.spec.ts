import { expect, test } from "./authenticated-session";

const forms = [
  { route: "/properties", title: "속성 추가" },
  { route: "/tenants", title: "임차인 추가" },
  { route: "/contracts", title: "계약 추가" },
  { route: "/maintenance", title: "작업 등록" },
  { route: "/inspections", title: "점검 등록" },
];

for (const form of forms) {
  test(`${form.route} opens and dismisses its create dialog without changing records`, async ({ page }) => {
    let mutations = 0;
    await page.route("**/api/**", async (route) => {
      if (!["GET", "HEAD"].includes(route.request().method())) { mutations += 1; await route.abort(); }
      else await route.continue();
    });
    await page.goto(form.route);
    const trigger = page.getByRole("button", { name: form.title, exact: true });
    await trigger.click();
    const dialog = page.getByRole("dialog", { name: form.title, exact: true });
    await expect(dialog).toBeVisible();
    await dialog.getByRole("button", { name: "취소", exact: true }).click();
    await expect(dialog).not.toBeVisible();
    expect(mutations).toBe(0);
  });
}
