import type { Instrumentation } from "next";

export async function register() {
  if (process.env.NEXT_RUNTIME === "nodejs") {
    const { registerServerTelemetry } = await import("./lib/telemetry/server");
    registerServerTelemetry();
  }
}

export const onRequestError: Instrumentation.onRequestError = async (err, request, context) => {
  if (process.env.NEXT_RUNTIME === "nodejs") {
    const { reportRequestError } = await import("./lib/telemetry/server");
    reportRequestError(err, request, context);
  }
};
