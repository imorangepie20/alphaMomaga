import { randomUUID } from "node:crypto";
import { apiAuthorization, expect, test } from "./authenticated-session";
import type { MonthlyCharge, PaymentReceipt } from "../src/lib/billing";

// Run explicitly against a disposable fixture, never as part of public CI.
test("approves a dedicated draft, records a partial receipt, and restores the balance by void", async ({ page, request }) => {
  test.setTimeout(90_000);
  expect(process.env.PLAYWRIGHT_BILLING_MUTATIONS).toBe("dedicated-test-data");
  const apiUrl = process.env.API_URL;
  const chargeId = process.env.PLAYWRIGHT_BILLING_CHARGE_ID;
  const month = process.env.PLAYWRIGHT_BILLING_MONTH;
  expect(apiUrl, "An explicit test API URL is required").toBeTruthy();
  expect(process.env.PLAYWRIGHT_BASE_URL, "An explicit test web URL is required").toBeTruthy();
  expect(chargeId, "A dedicated draft charge ID is required").toBeTruthy();
  expect(month).toMatch(/^[1-9][0-9]{3}-(0[1-9]|1[0-2])$/);
  const headers = apiAuthorization();
  const endpoint = (path: string) => `${apiUrl!.replace(/\/$/, "")}/${path}`;
  async function charges(): Promise<MonthlyCharge[]> {
    const response = await request.get(endpoint(`monthly-charges?billingMonth=${month}`), { headers });
    expect(response.status()).toBe(200);
    return response.json();
  }
  async function receipts(): Promise<PaymentReceipt[]> {
    const response = await request.get(endpoint(`payment-receipts?billingMonth=${month}`), { headers });
    expect(response.status()).toBe(200);
    return response.json();
  }

  const initial = await charges();
  // The page currently lacks charge IDs in its rows. Refuse ambiguous targeting.
  expect(initial, "Use a dedicated month containing exactly one test charge").toHaveLength(1);
  const charge = initial[0];
  expect(charge.id).toBe(chargeId);
  expect(charge.status).toBe("Draft");
  expect(charge.receivedWon).toBe(0);
  expect(charge.billedWon).toBeGreaterThanOrEqual(3);
  const tenantsResponse = await request.get(endpoint("tenants"), { headers });
  expect(tenantsResponse.status()).toBe(200);
  const tenants: { id: string; name: string }[] = await tenantsResponse.json();
  expect(tenants.find((tenant) => tenant.id === charge.tenantId)?.name,
    "Only an explicitly named browser-test tenant may be changed").toMatch(/^E2E-BILLING-/);

  const amount = Math.floor(charge.billedWon / 3);
  const reference = `E2E-BILLING-${randomUUID()}`;
  const reason = `Browser verification reversal ${reference}`;
  const won = (value: number) => `₩${value.toLocaleString("ko-KR")}`;
  const mutationScope: { receiptId?: string } = {};
  await page.route("**/api/billing/**", async (route) => {
    const request = route.request();
    const path = new URL(request.url()).pathname;
    const body = request.postData() ? request.postDataJSON() : undefined;
    const allowed = request.method() === "POST" && (
      path === `/api/billing/monthly-charges/${encodeURIComponent(charge.id)}/approve`
      || (path === "/api/billing/payment-receipts" && body?.tenantId === charge.tenantId
        && body?.propertyId === charge.propertyId && body?.amountWon === amount && body?.reference === reference
        && body?.allocations?.length === 1 && body.allocations[0].chargeId === charge.id
        && body.allocations[0].amountWon === amount)
      || (mutationScope.receiptId !== undefined && path === `/api/billing/payment-receipts/${encodeURIComponent(mutationScope.receiptId)}/void`
        && body?.reason === reason)
    );
    if (!allowed) await route.abort();
    expect(allowed, "Refusing a mutation outside the explicit billing fixture").toBe(true);
    if (allowed) await route.continue();
  });
  await page.goto(`/payments?billingMonth=${month}`);
  const row = page.getByRole("row").filter({ has: page.getByRole("button", { name: "청구 확정", exact: true }) });
  await expect(row).toHaveCount(1);
  const approval = page.waitForResponse((response) => response.url().endsWith(`/monthly-charges/${chargeId}/approve`) && response.request().method() === "POST");
  await row.getByRole("button", { name: "청구 확정", exact: true }).click();
  expect((await approval).status()).toBe(201);
  await expect.poll(async () => (await charges())[0].status).not.toBe("Draft");

  await page.getByRole("button", { name: "수납 등록", exact: true }).click();
  const dialog = page.getByRole("dialog", { name: "수납 등록", exact: true });
  await dialog.getByLabel("임차인", { exact: true }).selectOption(charge.tenantId);
  await dialog.getByRole("spinbutton", { name: `${chargeId} 배분 금액`, exact: true }).fill(String(amount));
  await dialog.getByLabel("거래 참조번호", { exact: true }).fill(reference);
  const receiptResponse = page.waitForResponse((response) => response.url().endsWith("/api/billing/payment-receipts") && response.request().method() === "POST");
  await dialog.getByRole("button", { name: "수납 저장", exact: true }).click();
  expect((await receiptResponse).status()).toBe(201);
  await expect(dialog).not.toBeVisible();
  await expect.poll(async () => (await charges())[0].receivedWon).toBe(amount);
  const ledgerRow = page.getByRole("table").getByRole("row").nth(1);
  await expect(ledgerRow.getByRole("cell").nth(2)).toHaveText(won(charge.billedWon));
  await expect(ledgerRow.getByRole("cell").nth(3)).toHaveText(won(amount));
  await expect(ledgerRow.getByRole("cell").nth(4)).toHaveText(won(charge.billedWon - amount));

  const created = (await receipts()).filter((receipt) => receipt.reference === reference);
  expect(created).toHaveLength(1);
  const receipt = created[0];
  mutationScope.receiptId = receipt.id;
  expect(receipt.allocations).toEqual([{ chargeId, amountWon: amount }]);
  const reasonInput = page.getByRole("textbox", { name: `${receipt.id} 취소 사유`, exact: true });
  await reasonInput.fill(reason);
  const voidResponse = page.waitForResponse((response) => response.url().endsWith(`/payment-receipts/${receipt.id}/void`) && response.request().method() === "POST");
  await reasonInput.locator("..").getByRole("button", { name: "영수증 취소", exact: true }).click();
  expect((await voidResponse).status()).toBe(201);
  await expect.poll(async () => (await charges())[0].receivedWon).toBe(0);
  await expect(ledgerRow.getByRole("cell").nth(4)).toHaveText(won(charge.billedWon));
  await expect(page.getByText(`취소됨: ${reason}`, { exact: true })).toBeVisible();
  const reversed = (await receipts()).find((item) => item.id === receipt.id);
  expect(reversed?.voidedAt).toBeTruthy();
  expect(reversed?.voidReason).toBe(reason);
  expect(reversed?.amountWon).toBe(amount);
  expect(reversed?.allocations).toEqual(receipt.allocations);
  // Keep the approved charge and voided receipt as audit evidence. No DELETE or reset.
});
