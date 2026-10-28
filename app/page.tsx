import { Dashboard } from "@/components/Dashboard";

export default function Home() {
  return (
    <main className="page">
      <h1>HyperDX telemetry demo</h1>
      <p className="muted">
        Traces, logs, metrics, errors, session replay and custom events from a Next.js app, browser and server.
      </p>
      <Dashboard />
    </main>
  );
}
