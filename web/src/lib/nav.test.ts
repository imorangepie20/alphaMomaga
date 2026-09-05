import { expect, it } from "vitest";
import { navigationFor } from "./nav";

const paths = (permissions: Parameters<typeof navigationFor>[0]) => navigationFor(permissions).flatMap((group) => group.items.map((item) => item.href));
it("only exposes audit history to user administrators", () => {
  expect(paths(["user:manage"])).toContain("/admin/audit-logs");
  expect(paths(["report:read"])).not.toContain("/admin/audit-logs");
  expect(paths([])).not.toContain("/admin/audit-logs");
});
it("omits user administration without its actual permission", () => {
  expect(paths(["report:read"])).not.toContain("/admin/users");
  expect(paths(["report:read"])).not.toContain("/admin/roles");
  expect(paths(["report:read"])).toContain("/admin/reports");
  expect(paths(["user:manage"])).toContain("/admin/users");
});
it("keeps account settings available but does not invent permissions", () => {
  expect(paths([])).toContain("/settings");
  expect(paths([])).not.toContain("/admin/users");
  expect(paths([])).not.toContain("/admin/reports");
});
