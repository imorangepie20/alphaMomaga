import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const globalStyles = readFileSync(resolve(__dirname, "globals.css"), "utf8");

describe("global form styles", () => {
  it("keeps native select options readable in dark mode", () => {
    expect(globalStyles).toMatch(/select option\s*\{[^}]*background-color:\s*Canvas;[^}]*color:\s*CanvasText;/s);
  });
});
