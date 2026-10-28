import {
  context,
  propagation,
  type Attributes,
  type Span,
  SpanStatusCode,
  trace,
} from "@opentelemetry/api";
import { TRACER_NAME } from "../config";

export const tracer = trace.getTracer(TRACER_NAME);

/** Runs `fn` inside a child span, recording failures as exceptions on the span. */
export function withSpan<T>(
  name: string,
  attributes: Attributes,
  fn: (span: Span) => Promise<T> | T,
): Promise<T> {
  return tracer.startActiveSpan(name, { attributes }, async (span) => {
    try {
      return await fn(span);
    } catch (err) {
      span.recordException(err as Error);
      span.setStatus({ code: SpanStatusCode.ERROR, message: (err as Error).message });
      throw err;
    } finally {
      span.end();
    }
  });
}

/** Next's fetch does not forward trace headers, so inject the W3C context by hand. */
export function upstreamFetch(url: string | URL, init: RequestInit = {}): Promise<Response> {
  const headers = new Headers(init.headers);
  const carrier: Record<string, string> = {};
  propagation.inject(context.active(), carrier);
  for (const [key, value] of Object.entries(carrier)) headers.set(key, value);
  return fetch(url, { ...init, headers });
}
