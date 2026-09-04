import { describe, expect, it } from "vitest";

import nextConfig from "./next.config";

describe("nextConfig", () => {
  it("allows the Cloudflare development hostname to load Next dev resources", () => {
    expect(nextConfig.allowedDevOrigins).toContain("mnre.approid.team");
  });
});
