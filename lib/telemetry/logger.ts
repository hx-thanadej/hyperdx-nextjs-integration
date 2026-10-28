import * as HyperDX from "@hyperdx/node-opentelemetry";
import winston from "winston";

let instance: winston.Logger | undefined;

// Created lazily so the SDK is initialised (instrumentation.ts) before the transport reads its config.
export function getLogger(): winston.Logger {
  instance ??= winston.createLogger({
    level: "debug",
    format: winston.format.json(),
    transports: [
      new winston.transports.Console(),
      HyperDX.getWinstonTransport("debug", { detectResources: true }),
    ],
  });
  return instance;
}
