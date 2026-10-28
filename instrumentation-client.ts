import HyperDX from "@hyperdx/browser";
import { TAGS } from "./lib/config";

HyperDX.init({
  url: process.env.NEXT_PUBLIC_HYPERDX_URL,
  apiKey: process.env.NEXT_PUBLIC_HYPERDX_API_KEY!,
  service: "hyperdx-nextjs-browser",
  otelResourceAttributes: TAGS,
  // Add a traceparent header to calls to our own API so browser and server spans share a trace.
  tracePropagationTargets: [/localhost:3000/i],
  consoleCapture: true,
  advancedNetworkCapture: true,
  // Session replay privacy: elements with these classes are masked or blocked.
  maskClass: "hdx-mask",
  blockClass: "hdx-block",
});
