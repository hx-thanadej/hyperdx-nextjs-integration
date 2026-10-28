import * as HyperDX from "@hyperdx/node-opentelemetry";
import { TAGS } from "@/lib/config";
import { getLogger } from "@/lib/telemetry/logger";
import { durationHistogram } from "@/lib/telemetry/metrics";
import { upstreamFetch, withSpan } from "@/lib/telemetry/tracing";
import { USERS } from "@/lib/users";

// browser -> this route -> /api/trace/leaf: one trace across three hops.
export async function GET(request: Request) {
  const started = performance.now();
  const userId = new URL(request.url).searchParams.get("user") ?? USERS[0].id;
  const user = USERS.find((u) => u.id === userId) ?? USERS[0];

  // Attached to every span and log produced while this request is in flight.
  HyperDX.setTraceAttributes({
    ...TAGS,
    userId: user.id,
    userEmail: user.email,
    userName: user.name,
    teamName: user.teamName,
    plan: user.plan,
  });

  const data = await withSpan("chain.load-dashboard", { "app.user.id": user.id }, async () => {
    const res = await upstreamFetch(new URL("/api/trace/leaf", request.url));
    return (await res.json()) as { orders: string[] };
  });

  const durationMs = Math.round(performance.now() - started);
  durationHistogram.record(durationMs, { operation: "chain", route: "/api/trace/chain" });
  getLogger().info("chain completed", { userId: user.id, orders: data.orders.length, durationMs });
  return Response.json({ user: user.id, plan: user.plan, ...data, durationMs });
}
