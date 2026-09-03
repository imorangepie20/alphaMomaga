import { test, expect } from "@playwright/test";

type OperationalPage = {
  route: string;
  heading: string;
  marks: string[];
};

const pages: OperationalPage[] = [
  {
    route: "/tenants",
    heading: "임차인",
    marks: ["전체 임차인", "임차인 목록", "Kim Jihoon", "A-101", "₩1,200,000", "납부 완료"],
  },
  {
    route: "/contracts",
    heading: "계약",
    marks: ["유효 계약", "계약 일정", "Kim Jihoon", "A-101", "2027-08-31", "유효"],
  },
  {
    route: "/payments",
    heading: "수납",
    marks: ["수납 완료", "수납 현황", "Seoul Heights Tower", "₩12,400,000", "2026-08-31", "납부 완료"],
  },
  {
    route: "/maintenance",
    heading: "유지보수",
    marks: ["미완료 작업", "작업 요청", "Seoul Heights Tower", "승강기 정기 점검", "2026-09-07", "예정"],
  },
  {
    route: "/inspections",
    heading: "점검",
    marks: ["점검 예정", "긴급", "점검 일정", "Seoul Heights Tower", "소방 안전", "예정"],
  },
];

for (const operationalPage of pages) {
  test(`${operationalPage.route} renders its operational records`, async ({ page }) => {
    await page.goto(operationalPage.route);
    await expect(page.getByRole("heading", { name: operationalPage.heading })).toBeVisible();

    for (const mark of operationalPage.marks) {
      await expect(page.getByText(mark, { exact: true }).first()).toBeVisible();
    }
  });
}
