import { test, expect, apiAuthorization } from "./authenticated-session";

type OperationalPage = {
  route: string;
  endpoint: string;
  heading: string;
  fields: string[];
};

const apiUrl = process.env.API_URL ?? "http://localhost:3100";
const billingMonth = new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Seoul", year: "numeric", month: "2-digit" }).format(new Date()).slice(0, 7);

const pages: OperationalPage[] = [
  { route: "/tenants", endpoint: "/tenants", heading: "임차인", fields: ["name", "rent"] },
  { route: "/contracts", endpoint: "/contracts", heading: "계약", fields: ["unit", "monthlyRent", "endDate"] },
  { route: `/payments?billingMonth=${billingMonth}`, endpoint: `/monthly-charges?billingMonth=${billingMonth}`, heading: "수납 원장", fields: ["dueDate"] },
  { route: "/maintenance", endpoint: "/maintenance", heading: "유지보수", fields: ["task", "dueDate"] },
  { route: "/inspections", endpoint: "/inspections", heading: "점검", fields: ["type", "scheduledDate"] },
];

for (const operationalPage of pages) {
  test(`${operationalPage.route} renders records from the API`, async ({ page, request }) => {
    const apiResponse = await request.get(`${apiUrl}${operationalPage.endpoint}`, { headers: apiAuthorization() });
    expect(apiResponse.ok(), `GET ${apiUrl}${operationalPage.endpoint}`).toBeTruthy();

    const records = (await apiResponse.json()) as Array<Record<string, string>>;
    expect(records.length).toBeGreaterThan(0);

    await page.goto(operationalPage.route);
    await expect(page.getByRole("heading", { name: operationalPage.heading })).toBeVisible();

    for (const field of operationalPage.fields) {
      await expect(page.getByText(records[0][field], { exact: true }).first()).toBeVisible();
    }
  });
}
