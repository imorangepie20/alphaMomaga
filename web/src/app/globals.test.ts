import { readdirSync, readFileSync, statSync } from "node:fs";
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
const dashboardFiles = [
  "analytics/charts.tsx", "analytics/data.ts", "analytics/widgets.tsx",
  "academy/charts.tsx", "academy/data.ts", "academy/widgets.tsx",
  "crm/charts.tsx", "crm/data.ts", "crm/kpis.tsx", "crm/widgets.tsx",
  "ecommerce/charts.tsx", "ecommerce/data.ts", "ecommerce/kpis.tsx", "ecommerce/reviews.tsx", "ecommerce/tables.tsx",
  "file-manager/charts.tsx", "file-manager/data.ts", "file-manager/recent-files.tsx", "file-manager/widgets.tsx",
  "finance/charts.tsx", "finance/data.ts", "finance/kpis.tsx", "finance/widgets.tsx",
  "hotel/charts.tsx", "hotel/data.ts", "hotel/kpis.tsx", "hotel/widgets.tsx",
  "hospital/calendar-widget.tsx", "hospital/charts.tsx", "hospital/data.ts", "hospital/kpis.tsx", "hospital/widgets.tsx",
  "payment/balances-card.tsx", "payment/convert-currencies-card.tsx", "payment/data.ts", "payment/exchange-rates-card.tsx", "payment/transactions-card.tsx", "payment/verification-alert.tsx",
  "project-management/charts.tsx", "project-management/data.ts", "project-management/kpis.tsx", "project-management/widgets.tsx",
  "crypto/balance-summary.tsx", "crypto/bitcoin-price-card.tsx", "crypto/data.ts", "crypto/kpis.tsx", "crypto/recent-activities-card.tsx", "crypto/trade-card.tsx", "crypto/wallets-card.tsx",
  "sales/charts.tsx", "sales/data.ts", "sales/kpis.tsx", "sales/widgets.tsx",
] as const;
const taskSevenFiles = [
  ...dashboardFiles.map((file) =>
    resolve(__dirname, `../components/dashboards/${file}`)
  ),
  resolve(__dirname, "(dashboard)/error/404/page.tsx"),
  resolve(__dirname, "(dashboard)/error/500/page.tsx"),
  resolve(__dirname, "not-found.tsx"),
  resolve(__dirname, "../components/dashboards/shared/kpi-card.tsx"),
];
const taskEightRoots = [
  resolve(__dirname, "../components/apps"),
  resolve(__dirname, "../components/pages"),
  resolve(__dirname, "(dashboard)/apps"),
  resolve(__dirname, "(dashboard)/components"),
  resolve(__dirname, "(dashboard)/blocks"),
  resolve(__dirname, "(dashboard)/templates"),
  resolve(__dirname, "(dashboard)/widgets"),
  resolve(__dirname, "(dashboard)/examples/page.tsx"),
] as const;
const taskEightFormDemo = resolve(
  __dirname,
  "../components/pages/components-field/variants.tsx"
);
const commonUiRoot = resolve(__dirname, "../components/ui");
const darkVariant = ["dark", ":"].join("");
const darkThemeSelector = `.${"dark"}`;
const activeDarkColorScheme = new RegExp(
  `${darkThemeSelector.replace(".", "\\\\.")}\\s*\\{[^}]*color-scheme:\\s*${"dark"};`,
  "s"
);

function collectTaskEightFiles(path: string): string[] {
  if (statSync(path).isFile()) {
    return [path];
  }

  return readdirSync(path, { withFileTypes: true }).flatMap((entry) =>
    collectTaskEightFiles(resolve(path, entry.name))
  );
}

const taskEightFiles = taskEightRoots.flatMap(collectTaskEightFiles);
const commonUiFiles = collectTaskEightFiles(commonUiRoot).filter(
  (file) => !file.endsWith(".test.ts") && !file.endsWith(".test.tsx")
);

describe("global form styles", () => {
  it("declares a light color scheme for browser-native controls", () => {
    expect(globalStyles).toMatch(/:root\s*\{[^}]*color-scheme:\s*light;/);
  });

  it("does not retain an active dark color scheme", () => {
    expect(globalStyles).not.toMatch(activeDarkColorScheme);
  });

  it("keeps native select options readable with the light-only theme", () => {
    expect(globalStyles).toMatch(/select option\s*\{[^}]*background-color:\s*Canvas;[^}]*color:\s*CanvasText;/);
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
    expect(inputSource).not.toContain(darkVariant);
    expect(textareaSource).not.toContain(darkVariant);
    expect(nativeSelectSource).not.toContain(darkVariant);
    expect(selectSource).not.toContain(darkVariant);
    expect(buttonSource).not.toContain(darkVariant);
  });

  it("removes dark theme contracts from all common UI components", () => {
    for (const file of commonUiFiles) {
      const source = readFileSync(file, "utf8");

      expect(source).not.toContain(darkVariant);
      expect(source).not.toContain(darkThemeSelector);
    }
  });

  it("keeps bounded dashboard and error surfaces light-only", () => {
    for (const file of taskSevenFiles) {
      expect(readFileSync(file, "utf8")).not.toContain(darkVariant);
    }
  });

  it("keeps the bounded app and demo surfaces light-only", () => {
    for (const file of taskEightFiles) {
      expect(readFileSync(file, "utf8")).not.toContain(darkVariant);
    }
  });

  it("uses FormField in the catalog form example", () => {
    expect(readFileSync(taskEightFormDemo, "utf8")).toContain("<FormField");
  });
});
