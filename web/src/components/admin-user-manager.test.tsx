/* @vitest-environment jsdom */
import "@testing-library/jest-dom/vitest";
import { cleanup, render, screen, fireEvent } from "@testing-library/react";
import { afterEach, expect, it, vi } from "vitest";
import { AdminUserManager } from "./admin-user-manager";
vi.mock("next/navigation", () => ({ useRouter: () => ({ refresh: vi.fn() }) }));
afterEach(() => { cleanup(); vi.restoreAllMocks(); });
it("protects administrator accounts and excludes administrator promotion", () => {
  render(<AdminUserManager directory={{ users: [{ user_id: "actor", name: "관리자", blocked: false, email_verified: true, roles: [{ id: "admin", name: "Admin" }] }], total: 1, page: 0, pageSize: 20, subject: "actor" }} roles={[{ id: "admin", name: "Admin" }, { id: "finance", name: "Finance" }]} />);
  expect(screen.getByText("관리자·본인 보호")).toBeInTheDocument();
  expect(screen.queryByRole("button", { name: "차단" })).not.toBeInTheDocument();
  expect(screen.queryByRole("option", { name: "시스템 관리자", hidden: true })).not.toBeInTheDocument();
});
it("does not mutate if blocking confirmation is cancelled", () => {
  const confirm = vi.spyOn(window, "confirm").mockReturnValue(false);
  const fetcher = vi.spyOn(globalThis, "fetch");
  render(<AdminUserManager directory={{ users: [{ user_id: "target", email: "staff@example.test", blocked: false, email_verified: true, roles: [] }], total: 1, page: 0, pageSize: 20, subject: "actor" }} roles={[]} />);
  fireEvent.click(screen.getByRole("button", { name: "차단" }));
  expect(confirm).toHaveBeenCalled();
  expect(fetcher).not.toHaveBeenCalled();
});
