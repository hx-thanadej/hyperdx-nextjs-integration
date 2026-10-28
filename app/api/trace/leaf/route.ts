import { sleep } from "@/lib/sleep";
import { durationHistogram } from "@/lib/telemetry/metrics";
import { withSpan } from "@/lib/telemetry/tracing";

// Plays the role of a downstream service (database, internal API).
export async function GET() {
  const started = performance.now();
  const orders = await withSpan(
    "db.query orders",
    { "db.system": "postgresql", "db.operation": "SELECT", "db.sql.table": "orders" },
    async (span) => {
      await sleep(20 + Math.random() * 120);
      const rows = 1 + Math.floor(Math.random() * 5);
      span.setAttribute("db.rows_returned", rows);
      return Array.from({ length: rows }, (_, i) => `order-${i + 1}`);
    },
  );
  durationHistogram.record(performance.now() - started, { operation: "db.query", route: "/api/trace/leaf" });
  return Response.json({ orders });
}
