import { getLogger } from "@/lib/telemetry/logger";
import { withSpan } from "@/lib/telemetry/tracing";

export async function GET(request: Request) {
  const mode = new URL(request.url).searchParams.get("mode") ?? "unhandled";

  if (mode === "handled") {
    // Caught here: the span records the exception, we log it, and return a clean 500.
    try {
      await withSpan("errors.handled", { "app.error_mode": mode }, () => {
        throw new Error("Handled server error: payment provider timeout");
      });
    } catch (err) {
      getLogger().error("handled server error", { message: (err as Error).message });
      return Response.json({ error: (err as Error).message }, { status: 500 });
    }
  }

  // Not caught: Next returns 500 and calls onRequestError in instrumentation.ts.
  throw new Error("Unhandled server error: route handler crashed");
}
