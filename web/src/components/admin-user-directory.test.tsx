/* @vitest-environment jsdom */
import "@testing-library/jest-dom/vitest";
import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, expect, it, vi } from "vitest";
import { AdminUserDirectory } from "./admin-user-directory";
vi.mock("@/lib/admin-access", () => ({ getAdminAccess: async () => ({}), AdminAccessError: class extends Error {} }));
vi.mock("@/lib/billing", () => ({ BillingApiError: class extends Error {} }));
vi.mock("@/lib/admin-users", () => ({ readAdminUsers: async (path: string) => path === "/roles" ? [] : { users: [], total: 3, page: 0, pageSize: 20, subject: "actor" } }));
vi.mock("./admin-user-manager", () => ({ AdminUserManager: () => <div>사용자 목록</div> }));
afterEach(cleanup);
it("uses a task-focused header with a separate user count", async () => {
  render(await AdminUserDirectory({}));
  expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent("사용자 관리");
  expect(screen.getByText("계정 초대와 접근 권한을 관리합니다.")).toBeInTheDocument();
  expect(screen.getByText("전체 3명")).toBeInTheDocument();
  expect(screen.queryByText(/Auth0 테넌트 계정/)).not.toBeInTheDocument();
  expect(screen.queryByText(/현재 1페이지/)).not.toBeInTheDocument();
});
it("labels a filtered count as search results", async () => {
  render(await AdminUserDirectory({ email: "staff@example.test" }));
  expect(screen.getByText("검색 결과 3명")).toBeInTheDocument();
});
