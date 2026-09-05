import { expect, it } from "vitest";
import { managedApproval } from "./managed-approval";
it("distinguishes missing, valid, ambiguous and unrelated roles", () => {
  expect(managedApproval([])).toBe("pending");
  expect(managedApproval([{ id: "x", name: "OtherApp" }])).toBe("pending");
  expect(managedApproval([{ id: "f", name: "Finance" }])).toBe("approved");
  expect(managedApproval([{ id: "f", name: "Finance" }, { id: "i", name: "Inspector" }])).toBe("review");
});
