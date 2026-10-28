import { sleep } from "@/lib/sleep";
import { getLogger } from "@/lib/telemetry/logger";
import { durationHistogram } from "@/lib/telemetry/metrics";
import { withSpan } from "@/lib/telemetry/tracing";

export async function GET(request: Request) {
  const requested = Number(new URL(request.url).searchParams.get("ms") ?? 1200);
  const ms = Math.min(Math.max(requested, 0), 5000);
  await withSpan("slow.operation", { "app.delay_ms": ms }, () => sleep(ms));
  durationHistogram.record(ms, { operation: "slow", route: "/api/slow" });
  getLogger().warn("slow operation finished", { delayMs: ms });
  return Response.json({ delayMs: ms });
}
