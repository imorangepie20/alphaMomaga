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
const textareaSource = readFileSync(
  resolve(__dirname, "../components/ui/textarea.tsx"),
  "utf8"
);
const selectSource = readFileSync(
  resolve(__dirname, "../components/ui/select.tsx"),
  "utf8"
);
const buttonSource = readFileSync(
  resolve(__dirname, "../components/ui/button.tsx"),
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

  it("uses the shared height token in every default form control", () => {
    expect(inputSource).toContain("h-(--control-height)");
    expect(textareaSource).toContain("min-h-(--control-height)");
    expect(nativeSelectSource).toContain("h-(--control-height)");
    expect(selectSource).toContain("h-(--control-height)");
    expect(buttonSource).toContain("h-(--control-height)");
  });

  it("keeps shared controls light-only", () => {
    expect(inputSource).not.toContain("dark:");
    expect(textareaSource).not.toContain("dark:");
    expect(nativeSelectSource).not.toContain("dark:");
    expect(selectSource).not.toContain("dark:");
    expect(buttonSource).not.toContain("dark:");
  });
});
