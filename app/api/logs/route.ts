import { getLogger } from "@/lib/telemetry/logger";

const LEVELS = ["debug", "info", "warn", "error"] as const;
type Level = (typeof LEVELS)[number];

// Emits one structured winston log and one console log (captured by consoleCapture).
export async function POST(request: Request) {
  const body = (await request.json()) as { level?: string; message?: string; fields?: object };
  const level: Level = LEVELS.includes(body.level as Level) ? (body.level as Level) : "info";
  const message = body.message ?? `demo ${level} log`;
  const fields = body.fields ?? {};

  getLogger()[level](message, { source: "winston", ...fields });
  const consoleMethod = level === "debug" ? "log" : level;
  console[consoleMethod](`[console] ${message}`, { source: "console", ...fields });

  return Response.json({ level, message });
}
