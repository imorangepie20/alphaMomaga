import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Cloudflare Tunnel forwards the public hostname to this local dev server.
  allowedDevOrigins: ["mnre.approid.team"],
};

export default nextConfig;
