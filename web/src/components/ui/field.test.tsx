/* @vitest-environment jsdom */

import "@testing-library/jest-dom/vitest"
import { render, screen } from "@testing-library/react"
import { describe, expect, it } from "vitest"

import { FormField } from "@/components/ui/field"
import { Input } from "@/components/ui/input"

describe("FormField", () => {
  it("connects a label and displays an accessible validation error", () => {
    render(
      <FormField
        label="임차인"
        htmlFor="tenant"
        error="임차인을 선택하세요"
      >
        <Input id="tenant" />
      </FormField>,
    )

    expect(screen.getByLabelText("임차인")).toBeInTheDocument()
    expect(screen.getByRole("alert")).toHaveTextContent("임차인을 선택하세요")
    expect(screen.getByTestId("form-field")).toHaveClass("gap-2")
  })
})
