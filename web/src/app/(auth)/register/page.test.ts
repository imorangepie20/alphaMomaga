import { readFileSync } from "node:fs";
import { expect, it } from "vitest";
it("uses real Auth0 signup and returns to approval waiting", () => {
  const source = readFileSync(new URL("./page.tsx", import.meta.url), "utf8");
  expect(source).toContain("screen_hint=signup");
  expect(source).toContain("returnTo=%2Fpending-approval");
  expect(source).not.toContain("preventDefault");
});
