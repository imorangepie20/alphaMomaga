/* @vitest-environment jsdom */
import "@testing-library/jest-dom/vitest";
import { cleanup, render, screen, fireEvent, waitFor } from "@testing-library/react";
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

const directory = { users: [{ user_id: "auth0|target", email: "staff@example.test", blocked: false, email_verified: true, roles: [] }], total: 1, page: 0, pageSize: 20, subject: "actor" };
const roles = [{ id: "finance", name: "Finance" }];

it("submits an invitation when the visible issue button is clicked", async () => {
  vi.spyOn(window, "confirm").mockReturnValue(true);
  const fetcher = vi.spyOn(globalThis, "fetch").mockResolvedValue(Response.json({ ticket: "https://example.test/invite" }));
  render(<AdminUserManager directory={directory} roles={roles} />);
  fireEvent.click(screen.getByText("직원 계정 초대"));
  fireEvent.change(screen.getByLabelText("이메일"), { target: { value: "new@example.test" } });
  fireEvent.change(screen.getByLabelText("운영 역할"), { target: { value: "finance" } });
  fireEvent.click(screen.getByRole("button", { name: "초대 링크 발급" }));
  await waitFor(() => expect(fetcher).toHaveBeenCalledWith("/api/admin-users/invite", expect.objectContaining({ body: JSON.stringify({ email: "new@example.test", roleId: "finance" }) })));
});

it("submits a role change by clicking change rather than submitting the form directly", async () => {
  vi.spyOn(window, "confirm").mockReturnValue(true);
  const fetcher = vi.spyOn(globalThis, "fetch").mockResolvedValue(Response.json({ ok: true }));
  render(<AdminUserManager directory={directory} roles={roles} />);
  fireEvent.change(screen.getByLabelText("staff@example.test 역할"), { target: { value: "finance" } });
  fireEvent.click(screen.getByRole("button", { name: "변경" }));
  await waitFor(() => expect(fetcher).toHaveBeenCalledWith("/api/admin-users/auth0%7Ctarget/role", expect.objectContaining({ body: JSON.stringify({ roleId: "finance" }) })));
});

it("sends the block request after confirmation", async () => {
  vi.spyOn(window, "confirm").mockReturnValue(true);
  const fetcher = vi.spyOn(globalThis, "fetch").mockResolvedValue(Response.json({ ok: true }));
  render(<AdminUserManager directory={directory} roles={roles} />);
  fireEvent.click(screen.getByRole("button", { name: "차단" }));
  await waitFor(() => expect(fetcher).toHaveBeenCalledWith("/api/admin-users/auth0%7Ctarget/block", expect.objectContaining({ body: JSON.stringify({ blocked: true }) })));
});
it("sends an unblock request for a blocked account", async () => {
  vi.spyOn(window, "confirm").mockReturnValue(true);
  const fetcher = vi.spyOn(globalThis, "fetch").mockResolvedValue(Response.json({ ok: true }));
  render(<AdminUserManager directory={{ ...directory, users: [{ ...directory.users[0], blocked: true }] }} roles={roles} />);
  fireEvent.click(screen.getByRole("button", { name: "차단 해제" }));
  await waitFor(() => expect(fetcher).toHaveBeenCalledWith("/api/admin-users/auth0%7Ctarget/block", expect.objectContaining({ body: JSON.stringify({ blocked: false }) })));
});

it("shows API failure and re-enables the role submit button", async () => {
  vi.spyOn(window, "confirm").mockReturnValue(true);
  vi.spyOn(globalThis, "fetch").mockResolvedValue(Response.json({ message: "역할 변경 권한이 없습니다." }, { status: 403 }));
  render(<AdminUserManager directory={directory} roles={roles} />);
  fireEvent.change(screen.getByLabelText("staff@example.test 역할"), { target: { value: "finance" } });
  fireEvent.click(screen.getByRole("button", { name: "변경" }));
  await waitFor(() => expect(screen.getByRole("status")).toHaveTextContent("역할 변경 권한이 없습니다."));
  expect(screen.getByRole("button", { name: "변경" })).toBeEnabled();
});
