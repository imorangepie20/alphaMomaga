import { readFileSync } from "node:fs"
import { resolve } from "node:path"
import { describe, expect, it } from "vitest"

const sidebar = readFileSync(resolve(__dirname, "app-sidebar.tsx"), "utf8")
const authCard = readFileSync(resolve(__dirname, "../auth/auth-card.tsx"), "utf8")

describe("application branding", () => {
  it("uses the provided Alpha Momega logo in the dashboard and authentication entry points", () => {
    for (const source of [sidebar, authCard]) {
      expect(source).toContain('src="/ChatGPT Image Sep 4, 2026, 11_49_33 AM.png"')
      expect(source).toContain('alt="Alpha Momega"')
    }
  })
})
