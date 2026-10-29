# HyperDX + Next.js integration

A Next.js 16 app that sends every kind of telemetry to [HyperDX](https://www.hyperdx.io/): traces, logs, metrics, errors, session replay and custom events, from both the browser and the server. It ships with a Docker Compose file that runs HyperDX locally as four separate services.

Follows the HyperDX [Next.js](https://www.hyperdx.io/docs/install/next) and [browser](https://www.hyperdx.io/docs/install/browser) guides.

## What it covers

| Signal | Where | How |
|---|---|---|
| Server traces | [`instrumentation.ts`](instrumentation.ts), [`lib/telemetry/server.ts`](lib/telemetry/server.ts) | `@hyperdx/node-opentelemetry` auto-instruments HTTP, fetch and Next's own spans |
| Custom spans | [`lib/telemetry/tracing.ts`](lib/telemetry/tracing.ts) | `withSpan()` adds child spans and records thrown errors |
| Browser to server traces | [`instrumentation-client.ts`](instrumentation-client.ts), `upstreamFetch()` | `tracePropagationTargets` sends `traceparent`; `upstreamFetch()` forwards it to the next hop |
| Server logs | [`lib/telemetry/logger.ts`](lib/telemetry/logger.ts) | winston with the HyperDX transport, plus `consoleCapture` for `console.*` |
| Custom metrics | [`lib/telemetry/metrics.ts`](lib/telemetry/metrics.ts) | counter, histogram, up-down counter, observable gauge |
| Runtime and host metrics | [`lib/telemetry/server.ts`](lib/telemetry/server.ts) | `HostMetrics` and `RuntimeNodeInstrumentation` (event loop, GC, V8 heap, CPU, memory, network) |
| Server errors | `onRequestError` in [`instrumentation.ts`](instrumentation.ts) | every unhandled render, route and action error becomes a span with an exception |
| Browser errors | [`components/sections.tsx`](components/sections.tsx) | uncaught errors, unhandled rejections, React error boundary, `recordException` |
| Session replay | [`instrumentation-client.ts`](instrumentation-client.ts) | on by default; `hdx-mask` and `hdx-block` classes hide elements; stop and resume from the UI |
| Network capture | both SDKs | `advancedNetworkCapture` records headers and bodies |
| User and custom attributes | `setGlobalAttributes` (browser), `setTraceAttributes` (server) | user id, email, plan on every event |
| Static tags | [`lib/config.ts`](lib/config.ts) | `project` and `env` resource attributes on every signal |
| Custom events | `HyperDX.addAction` | `Form-Completed` and `Run-All-Clicked` |
| Server Actions | [`app/actions.ts`](app/actions.ts) | traced end to end, with an error path |
| Server Components | [`app/server-render/page.tsx`](app/server-render/page.tsx) | custom span plus a downstream call |

The home page has a button for each signal and a **Generate every signal** button that fires them all.

## Run it

You need Docker and Node 20.9 or newer (tested on Node 22).

```bash
# 1. Start HyperDX (UI on http://localhost:8080, OTLP on 4317 and 4318)
docker compose -f infra/hyperdx/docker-compose.yml up -d

# 2. Open http://localhost:8080 and register the first account.
#    Then copy the ingestion key from Team Settings > API Keys.

# 3. Configure the app
cp .env.example .env.local        # paste the key into both *_API_KEY values

# 4. Build and start (NEXT_PUBLIC_* values are fixed at build time)
npm install
npm run build && npm start        # http://localhost:3000
```

Open http://localhost:3000, click **Generate every signal**, then look at HyperDX. Logs, traces and sessions appear within seconds. Metrics are exported every 60 seconds.

### Run the app in Docker

The repo has a multi-stage [`Dockerfile`](Dockerfile) (Next.js standalone output, non-root user, health check) and a root [`docker-compose.yml`](docker-compose.yml) that runs the app next to the HyperDX stack in one Compose project.

```bash
# After steps 1 to 3 above (HyperDX running, account registered, .env.local filled in)
docker compose --env-file .env.local up -d --build
```

The app is on http://localhost:3000.

- The server container sends to the collector over the Compose network (`http://otel-collector:4318`). The browser sends to `NEXT_PUBLIC_HYPERDX_URL`, which must be reachable from your machine (`http://localhost:4318`).
- `NEXT_PUBLIC_*` values are baked into the image at build time. Rebuild with `--build` after changing the key or the collector URL.
- The root compose file uses the same project name (`hyperdx`) as `infra/hyperdx`, so it reuses the running stack, its volumes and your account.
- To start only the app and leave HyperDX alone: `docker compose --env-file .env.local up -d --build --no-deps web`.
- Stop everything with `docker compose --env-file .env.local down`. Add `-v` only if you want to delete the HyperDX data.

### Environment

| Variable | Purpose |
|---|---|
| `HYPERDX_API_KEY` | Ingestion key for the server SDK |
| `OTEL_EXPORTER_OTLP_ENDPOINT` | Collector URL, `http://localhost:4318` locally |
| `OTEL_SERVICE_NAME` | Server service name |
| `NEXT_PUBLIC_HYPERDX_API_KEY` | Ingestion key for the browser SDK. It is visible to every visitor, so use a separate key per environment |
| `NEXT_PUBLIC_HYPERDX_URL` | Collector URL as the browser sees it |
| `NEXT_PUBLIC_APP_PROJECT`, `NEXT_PUBLIC_APP_ENV` | Values for the `project` and `env` tags |

`.env.local` is git-ignored. Never commit a real key.

## Check that data arrived

From `infra/hyperdx`:

```bash
docker compose exec -T ch-server clickhouse-client -q "
  SELECT ServiceName, count() FROM otel_traces GROUP BY 1"
```

You should see `hyperdx-nextjs-server` and `hyperdx-nextjs-browser`. Other tables to look at: `otel_logs`, `otel_metrics_gauge`, `otel_metrics_sum`, `otel_metrics_histogram`, `hyperdx_sessions` (replay).

In the HyperDX UI, filter on the `project` and `env` resource attributes to see the tags. The ClickHouse queries above are the confirmed way to inspect the raw data.

## Things worth knowing

- **Trace headers.** Next's `fetch` does not forward `traceparent`, so a downstream call starts a new trace. `upstreamFetch()` injects it by hand. With it, one trace spans browser, route handler and downstream route.
- **Runtime metrics.** In this setup the SDK sent only the custom metrics. `HostMetrics` and `RuntimeNodeInstrumentation` are registered explicitly after `init()` to get event loop, GC, heap, CPU, memory and network metrics.
- **Browser console output** shows up as `console.*` spans in the Traces view, not in the Logs view. Server logs are in Logs.
- **Server Action errors.** A thrown Server Action error reaches the nearest React error boundary, so the form is wrapped in one. Without it, the whole page is replaced by Next's error screen.
- **`betaMode: true`** is required for `setTraceAttributes`.
- **Source maps.** The build emits browser source maps (`productionBrowserSourceMaps`), but uploading them to HyperDX is not set up here.
- **Schema.** The collector creates the official [ClickStack tables](https://clickhouse.com/docs/clickstack/ingesting-data/schemas) through its own migrations (`otel_*`, `hyperdx_sessions` with `TimestampTime`, and the `*_kv_rollup_15m` tables). Do not set `HYPERDX_OTEL_EXPORTER_CREATE_LEGACY_SCHEMA`: the legacy layout lacks `TimestampTime`, and session replay then fails to load.
- **Ports.** The compose file does not publish the HyperDX API port (8000). The UI proxies it, and 8000 is often taken.

Tested with Next.js 16.4.3 (also from the Docker image), `@hyperdx/browser` 0.26 and `@hyperdx/node-opentelemetry` 0.11 against the HyperDX 2.x images.
