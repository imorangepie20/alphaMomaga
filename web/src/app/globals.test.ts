import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const globalStyles = readFileSync(resolve(__dirname, "globals.css"), "utf8");
const inputSource = readFileSync(
  resolve(__dirname, "../components/ui/input.tsx"),
  "utf8"
);
const nativeSelectSource = readFileSync(
  resolve(__dirname, "../components/ui/native-select.tsx"),
  "utf8"
);

describe("global form styles", () => {
  it("declares a light color scheme for browser-native controls", () => {
    expect(globalStyles).toMatch(/:root\s*\{[^}]*color-scheme:\s*light;/s);
  });

  it("does not retain an active dark color scheme", () => {
    expect(globalStyles).not.toMatch(/\.dark\s*\{[^}]*color-scheme:\s*dark;/s);
  });

  it("keeps native select options readable with the light-only theme", () => {
    expect(globalStyles).toMatch(/select option\s*\{[^}]*background-color:\s*Canvas;[^}]*color:\s*CanvasText;/s);
  });

  it("defines the shared light control contract", () => {
    expect(globalStyles).toContain("--surface: var(--background)");
    expect(globalStyles).toContain("--surface-muted: var(--muted)");
    expect(globalStyles).toContain("--text: var(--foreground)");
    expect(globalStyles).toContain("--text-muted: var(--muted-foreground)");
    expect(globalStyles).toContain("--control-height: 2.25rem");
    expect(globalStyles).toContain("--control-border: var(--input)");
    expect(globalStyles).toContain("--dialog-padding: 1.5rem");
  });

  it("keeps text and native select controls light-only and compact", () => {
    expect(inputSource).toContain("h-9");
    expect(inputSource).not.toContain("dark:");
    expect(nativeSelectSource).toContain("h-9");
    expect(nativeSelectSource).not.toContain("dark:");
  });
});
