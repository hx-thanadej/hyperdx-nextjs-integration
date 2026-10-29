import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Self-contained server output (server.js plus only the needed node_modules) for the Docker image.
  output: "standalone",
  // Keep the SDK out of the bundle so its instrumentation can patch Node modules.
  serverExternalPackages: ["@hyperdx/node-opentelemetry", "winston"],
  // Browser source maps, so minified stack traces can be mapped back to source (see README).
  productionBrowserSourceMaps: true,
};

export default nextConfig;
