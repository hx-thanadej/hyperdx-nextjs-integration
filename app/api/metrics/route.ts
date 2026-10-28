import { clickCounter, durationHistogram, queueDepth } from "@/lib/telemetry/metrics";

type Kind = "click" | "duration" | "queue_up" | "queue_down";

export async function POST(request: Request) {
  const { kind, value } = (await request.json()) as { kind: Kind; value?: number };

  switch (kind) {
    case "click":
      clickCounter.add(1, { button: "demo" });
      break;
    case "duration":
      durationHistogram.record(value ?? Math.round(Math.random() * 400), { operation: "manual" });
      break;
    case "queue_up":
      queueDepth.add(1);
      break;
    case "queue_down":
      queueDepth.add(-1);
      break;
    default:
      return Response.json({ error: "unknown metric kind" }, { status: 400 });
  }
  return Response.json({ recorded: kind });
}
