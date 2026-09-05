/* @vitest-environment jsdom */
import "@testing-library/jest-dom/vitest";
import { cleanup, render, screen, fireEvent } from "@testing-library/react";
import { afterEach, expect, it } from "vitest";
import { AccountMenu } from "./account-menu";
afterEach(cleanup);
it("shows the name once and separates settings from logout", async () => {
  render(<AccountMenu name="조해" email="user@example.test" />);
  expect(screen.getAllByText("조해")).toHaveLength(1);
  fireEvent.click(screen.getByRole("button", { name: "계정 메뉴" }));
  expect(await screen.findByRole("menuitem", { name: "계정 설정" })).toHaveAttribute("href", "/settings");
  expect(screen.getByRole("menuitem", { name: "로그아웃" })).toHaveAttribute("href", "/auth/logout");
});
