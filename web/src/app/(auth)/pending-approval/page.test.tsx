import { renderToStaticMarkup } from "react-dom/server";
import { afterEach, expect, it, vi } from "vitest";
import PendingApprovalPage from "./page";
import { getApprovalStatus } from "@/lib/approval-status";
vi.mock("@/lib/require-session", () => ({ requireSession: vi.fn(async () => ({ user: {} })) }));
vi.mock("@/lib/approval-status", () => ({ getApprovalStatus: vi.fn() }));
vi.mock("next/navigation", () => ({ redirect: (path: string) => { throw new Error(`redirect:${path}`); } }));
afterEach(() => vi.resetAllMocks());
it("shows waiting and explicit permission refresh without business data", async () => {
  vi.mocked(getApprovalStatus).mockResolvedValue("pending");
  const html = renderToStaticMarkup(await PendingApprovalPage());
  expect(html).toContain("관리자 승인을 기다리고 있어요");
  expect(html).toContain("prompt=login");
  expect(html).toContain("/auth/logout");
});
it("distinguishes service errors from approval waiting", async () => {
  vi.mocked(getApprovalStatus).mockResolvedValue("unavailable");
  const html = renderToStaticMarkup(await PendingApprovalPage());
  expect(html).toContain("승인 상태를 확인할 수 없습니다");
  expect(html).not.toContain("관리자 승인을 기다리고 있어요");
});
it("redirects approved accounts into the dashboard", async () => {
  vi.mocked(getApprovalStatus).mockResolvedValue("approved");
  await expect(PendingApprovalPage()).rejects.toThrow("redirect:/dashboard/default");
});
