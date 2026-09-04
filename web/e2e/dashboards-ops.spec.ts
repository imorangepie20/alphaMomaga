import { test, expect } from "@playwright/test";

const storageState = process.env.PLAYWRIGHT_AUTH_STORAGE_STATE;

test.skip(
  !storageState,
  "Dashboard content checks require an authenticated Auth0 storage state."
);

if (storageState) {
  test.use({ storageState });
}

const dashboards = [
  {
    href: "/dashboard/hotel",
    marks: ["Booking List", "Campaign Overview", "Recent Activities"],
  },
  {
    href: "/dashboard/hospital",
    marks: ["Top Treatment", "Upcoming Appointments", "Patients by Department"],
  },
  {
    href: "/dashboard/real-estate",
    marks: ["The Somerset", "수납 성과 분석", "자산 구성"],
  },
];

for (const d of dashboards) {
  test(`${d.href} renders without error`, async ({ page }) => {
    const errors: string[] = [];
    page.on("pageerror", (e) => errors.push(e.message));
    const res = await page.goto(d.href);
    expect(res?.status(), `status ${d.href}`).toBeLessThan(400);
    for (const m of d.marks) {
      await expect(
        page.getByText(m, { exact: true }).first(),
        `"${m}" on ${d.href}`
      ).toBeVisible();
    }
    expect(errors, `pageerrors on ${d.href}`).toEqual([]);
  });
}
