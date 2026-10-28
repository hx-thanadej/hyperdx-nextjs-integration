// Static tags sent as resource attributes by both the server and browser SDKs.
export const TAGS = {
  project: process.env.NEXT_PUBLIC_APP_PROJECT ?? "hyperdx-nextjs-integration",
  env: process.env.NEXT_PUBLIC_APP_ENV ?? "local",
};

export const TRACER_NAME = "hyperdx-nextjs-integration";
