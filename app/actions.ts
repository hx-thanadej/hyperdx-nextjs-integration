"use server";

import { getLogger } from "@/lib/telemetry/logger";
import { withSpan } from "@/lib/telemetry/tracing";

export type FeedbackState = { ok: boolean; message: string };

export async function submitFeedback(_prev: FeedbackState, formData: FormData): Promise<FeedbackState> {
  const message = String(formData.get("message") ?? "").trim();

  return withSpan("action.submitFeedback", { "app.feedback.length": message.length }, async () => {
    if (!message) return { ok: false, message: "Message is required" };
    // Typing "fail" shows how a thrown server action error reaches onRequestError.
    if (message.toLowerCase().includes("fail")) throw new Error("Server action failed on purpose");
    getLogger().info("feedback received", { length: message.length });
    return { ok: true, message: "Thanks, feedback recorded" };
  });
}
