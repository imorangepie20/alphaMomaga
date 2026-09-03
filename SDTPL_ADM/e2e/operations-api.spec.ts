import { test, expect } from "@playwright/test";

type Operation = {
  route: string;
  endpoint: string;
  heading: string;
  fields: string[];
};

const apiUrl = process.env.API_URL ?? "https://api.approid.team";

const operations: Operation[] = [
  { route: "/tenants", endpoint: "/tenants", heading: "임차인", fields: ["name", "rent"] },
  { route: "/contracts", endpoint: "/contracts", heading: "계약", fields: ["endDate", "monthlyRent"] },
  { route: "/payments", endpoint: "/payments", heading: "수납", fields: ["amount", "dueDate"] },
  { route: "/maintenance", endpoint: "/maintenance", heading: "유지보수", fields: ["task", "dueDate"] },
  { route: "/inspections", endpoint: "/inspections", heading: "점검", fields: ["type", "scheduledDate"] },
];

for (const operation of operations) {
  test(`${operation.route} renders records from the public API`, async ({ page, request }) => {
    const apiResponse = await request.get(`${apiUrl}${operation.endpoint}`);
    expect(apiResponse.ok(), `GET ${apiUrl}${operation.endpoint}`).toBeTruthy();

    const records = (await apiResponse.json()) as Array<Record<string, string>>;
    expect(records.length).toBeGreaterThan(0);

    await page.goto(operation.route);
    await expect(page.getByRole("heading", { name: operation.heading })).toBeVisible();

    for (const field of operation.fields) {
      await expect(page.getByText(records[0][field], { exact: true }).first()).toBeVisible();
    }
  });
}
