import { metrics } from "@opentelemetry/api";
import { TRACER_NAME } from "../config";

const meter = metrics.getMeter(TRACER_NAME);

export const clickCounter = meter.createCounter("demo.button.clicks", {
  description: "Button clicks reported by the demo page",
  unit: "{click}",
});

export const durationHistogram = meter.createHistogram("demo.operation.duration", {
  description: "Duration of simulated operations",
  unit: "ms",
});

export const queueDepth = meter.createUpDownCounter("demo.queue.depth", {
  description: "Simulated queue depth",
  unit: "{item}",
});

meter
  .createObservableGauge("demo.process.heap_used", {
    description: "Node heap in use, sampled on every export",
    unit: "By",
  })
  .addCallback((result) => result.observe(process.memoryUsage().heapUsed));
