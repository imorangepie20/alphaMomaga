import { test, expect } from "@playwright/test";

test.use({ storageState: process.env.PLAYWRIGHT_AUTH_STORAGE_STATE, trace: "off" });
test.beforeEach(() => {
  expect(process.env.PLAYWRIGHT_AUTH_STORAGE_STATE, "Authenticated release checks require PLAYWRIGHT_AUTH_STORAGE_STATE; they must not silently skip.").toBeTruthy();
});

export function apiAuthorization() {
  const token = process.env.PLAYWRIGHT_API_TOKEN;
  expect(token, "API comparisons require a valid test account access token in PLAYWRIGHT_API_TOKEN.").toBeTruthy();
  return { authorization: `Bearer ${token}` };
}

export { test, expect };
