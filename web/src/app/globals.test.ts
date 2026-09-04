import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const globalStyles = readFileSync(resolve(__dirname, "globals.css"), "utf8");

describe("global form styles", () => {
  it("declares a light color scheme for browser-native controls", () => {
    expect(globalStyles).toMatch(/:root\s*\{[^}]*color-scheme:\s*light;/s);
  });

  it("keeps native select options readable in dark mode", () => {
    expect(globalStyles).toMatch(/select option\s*\{[^}]*background-color:\s*Canvas;[^}]*color:\s*CanvasText;/s);
  });
});
