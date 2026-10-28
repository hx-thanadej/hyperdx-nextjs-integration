import { headers } from "next/headers";
import Link from "next/link";
import { getLogger } from "@/lib/telemetry/logger";
import { upstreamFetch, withSpan } from "@/lib/telemetry/tracing";

export const dynamic = "force-dynamic";

// A Server Component that renders on the server and calls another route: server-only trace.
export default async function ServerRender() {
  const host = (await headers()).get("host") ?? "localhost:3000";
  const { orders } = await withSpan("rsc.server-render", { "app.page": "/server-render" }, async () => {
    const res = await upstreamFetch(`http://${host}/api/trace/leaf`);
    return (await res.json()) as { orders: string[] };
  });
  getLogger().info("server component rendered", { orders: orders.length });

  return (
    <main className="page">
      <h1>Server Component render</h1>
      <p>Rendered on the server with a custom span and a downstream call. Orders: {orders.join(", ")}</p>
      <p><Link href="/">Back to the demo</Link></p>
    </main>
  );
}
