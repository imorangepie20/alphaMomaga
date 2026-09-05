import { expect, test } from "./authenticated-session";

const forms = [
  { route: "/properties", title: "속성 추가" },
  { route: "/tenants", title: "임차인 추가" },
  { route: "/contracts", title: "계약 추가" },
  { route: "/maintenance", title: "작업 등록" },
  { route: "/inspections", title: "점검 등록" },
];

for (const viewport of [{ width: 1280, height: 900 }, { width: 390, height: 844 }]) {
  test.describe(`${viewport.width}px viewport`, () => {
    test.use({ viewport });

    for (const form of forms) {
      test(`${form.route} opens and dismisses its create dialog without changing records`, async ({ page }) => {
        let mutations = 0;
        await page.route("**/api/**", async (route) => {
          if (!["GET", "HEAD"].includes(route.request().method())) {
            mutations += 1;
            await route.abort();
          } else {
            await route.continue();
          }
        });
        await page.goto(form.route);
        const trigger = page.getByRole("button", { name: form.title, exact: true });
        await trigger.click();
        const dialog = page.getByRole("dialog", { name: form.title, exact: true });
        await expect(dialog).toBeVisible();
        if (form.route === "/maintenance") {
          await dialog.getByLabel("상태", { exact: true }).selectOption("Completed");
          await expect(dialog.getByLabel("완료일", { exact: true })).toHaveAttribute("required", "");
          await expect(dialog.getByLabel("처리 결과", { exact: true })).toHaveAttribute("required", "");
        }
        await expect.poll(async () => dialog.evaluate((element) => {
          const rect = element.getBoundingClientRect();
          return rect.left >= 0 && rect.top >= 0 && rect.right <= window.innerWidth
            && rect.bottom <= window.innerHeight && element.scrollWidth <= element.clientWidth + 1;
        })).toBe(true);
        await dialog.getByRole("button", { name: "취소", exact: true }).click();
        await expect(dialog).not.toBeVisible();
        if (form.route === "/inspections") {
          await page.getByRole("button", { name: /일정·상태 수정$/ }).first().click();
          const editDialog = page.getByRole("dialog", { name: "점검 일정·상태 수정", exact: true });
          await editDialog.getByLabel("상태", { exact: true }).selectOption("Completed");
          const result = editDialog.getByLabel("점검 결과", { exact: true });
          await expect(result).toHaveAttribute("required", "");
          await expect(result).toHaveAttribute("maxlength", "4000");
          await result.fill("브라우저 입력 확인: 저장하지 않습니다.");
          await expect.poll(async () => editDialog.evaluate((element) => {
            const rect = element.getBoundingClientRect();
            return rect.left >= 0 && rect.top >= 0 && rect.right <= window.innerWidth
              && rect.bottom <= window.innerHeight && element.scrollWidth <= element.clientWidth + 1;
          })).toBe(true);
          await editDialog.getByRole("button", { name: "취소", exact: true }).click();
          await expect(editDialog).not.toBeVisible();
        }
        expect(mutations).toBe(0);
      });
    }
  });
}
