import { init } from "@hyperdx/node-opentelemetry";
import { SpanStatusCode } from "@opentelemetry/api";
import { HostMetrics } from "@opentelemetry/host-metrics";
import { registerInstrumentations } from "@opentelemetry/instrumentation";
import { RuntimeNodeInstrumentation } from "@opentelemetry/instrumentation-runtime-node";
import { TAGS, TRACER_NAME } from "../config";
import { getLogger } from "./logger";
import { tracer } from "./tracing";

export function registerServerTelemetry() {
  init({
    apiKey: process.env.HYPERDX_API_KEY,
    service: process.env.OTEL_SERVICE_NAME ?? "hyperdx-nextjs-server",
    // Required for setTraceAttributes (per-request attributes on every child span and log).
    betaMode: true,
    // Console output becomes HyperDX logs, correlated with the active trace.
    consoleCapture: true,
    // Request and response headers and bodies on HTTP spans.
    advancedNetworkCapture: true,
    additionalResourceAttributes: TAGS,
  });

  // Process and system metrics (CPU, memory, network) plus event loop, GC and V8 heap metrics.
  new HostMetrics({ name: TRACER_NAME }).start();
  registerInstrumentations({ instrumentations: [new RuntimeNodeInstrumentation()] });
}

type RequestInfo = { path: string; method: string };
type ErrorContext = {
  routerKind: string;
  routePath: string;
  routeType: string;
  renderSource?: string;
};

/** Next calls this for every unhandled server error (render, route handler, action, proxy). */
export function reportRequestError(err: unknown, request: RequestInfo, context: ErrorContext) {
  const error = err instanceof Error ? err : new Error(String(err));
  const digest = typeof err === "object" && err !== null && "digest" in err ? String(err.digest) : "";

  tracer.startActiveSpan("next.request_error", (span) => {
    span.setAttributes({
      "http.request.method": request.method,
      "url.path": request.path,
      "next.route_path": context.routePath,
      "next.route_type": context.routeType,
      "next.router_kind": context.routerKind,
      "next.render_source": context.renderSource ?? "",
      "error.digest": digest,
    });
    span.recordException(error);
    span.setStatus({ code: SpanStatusCode.ERROR, message: error.message });
    getLogger().error("unhandled server error", {
      message: error.message,
      digest,
      routePath: context.routePath,
      routeType: context.routeType,
    });
    span.end();
  });
}
