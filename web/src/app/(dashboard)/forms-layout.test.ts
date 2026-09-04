import { readFileSync } from "node:fs"
import { resolve } from "node:path"
import { describe, expect, it } from "vitest"

const dialogSource = readFileSync(
  resolve(__dirname, "../../components/ui/dialog.tsx"),
  "utf8",
)
const fieldSource = readFileSync(
  resolve(__dirname, "../../components/ui/field.tsx"),
  "utf8",
)
const propertyManager = readFileSync(
  resolve(__dirname, "properties/property-manager.tsx"),
  "utf8",
)
const tenantManager = readFileSync(
  resolve(__dirname, "tenants/tenant-manager.tsx"),
  "utf8",
)
const contractManager = readFileSync(
  resolve(__dirname, "contracts/contract-manager.tsx"),
  "utf8",
)
const darkVariant = ["dark", ":"].join("")

describe("management form layout", () => {
  it("defines the standardized field boundary", () => {
    expect(fieldSource).toContain('data-slot="form-field"')
    expect(fieldSource).toContain('data-slot="form-field-label"')
    expect(fieldSource).toContain('data-slot="form-field-error"')
    expect(fieldSource).not.toContain(darkVariant)
  })

  it("keeps dialog chrome aligned with the shared form scale", () => {
    expect(dialogSource).toContain("p-(--dialog-padding)")
    expect(dialogSource).toContain("font-heading text-lg leading-none font-medium")
    expect(dialogSource).not.toContain("bg-background/40")
  })

  it("uses shared form fields and native selects in core manager dialogs", () => {
    for (const source of [propertyManager, tenantManager, contractManager]) {
      expect(source).toContain("FormField")
      expect(source).not.toMatch(/<select(?![^>]*NativeSelect)/)
    }

    expect(contractManager).toContain('htmlFor="contract-tenant"')
  })
})
