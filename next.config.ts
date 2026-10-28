import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Keep the SDK out of the bundle so its instrumentation can patch Node modules.
  serverExternalPackages: ["@hyperdx/node-opentelemetry", "winston"],
  // Browser source maps, so minified stack traces can be mapped back to source (see README).
  productionBrowserSourceMaps: true,
};

export default nextConfig;
