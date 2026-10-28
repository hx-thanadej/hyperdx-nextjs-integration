"use client";

import { useState } from "react";
import { callApi, note, post, type Entry } from "@/lib/client/api";
import {
  ActionsSection,
  ErrorsSection,
  IdentitySection,
  LogsSection,
  MetricsSection,
  ReplaySection,
  TracesSection,
} from "./sections";
import HyperDX from "@hyperdx/browser";

export function Dashboard() {
  const [entries, setEntries] = useState<Entry[]>([]);
  const [running, setRunning] = useState(false);
  const report = (entry: Entry) => setEntries((prev) => [entry, ...prev].slice(0, 40));

  // Fires one of every signal so a single click populates all of HyperDX.
  async function runAll() {
    setRunning(true);
    HyperDX.setGlobalAttributes({ userId: "u-2", userEmail: "bob@example.com", userName: "Bob", teamName: "Platform", plan: "pro" });
    console.info("run-all started", { area: "run-all" });
    report(await callApi("trace chain", "/api/trace/chain?user=u-2"));
    report(await callApi("slow request", "/api/slow?ms=800"));
    report(await callApi("server info log", "/api/logs", post({ level: "info", message: "run-all info" })));
    report(await callApi("server error log", "/api/logs", post({ level: "error", message: "run-all error" })));
    for (const kind of ["click", "duration", "queue_up", "queue_up", "queue_down"]) {
      report(await callApi(`metric ${kind}`, "/api/metrics", post({ kind })));
    }
    HyperDX.addAction("Run-All-Clicked", { source: "dashboard" });
    HyperDX.recordException(new Error("run-all handled client exception"), { area: "run-all" });
    report(await callApi("server handled", "/api/errors/server?mode=handled"));
    report(await callApi("server unhandled", "/api/errors/server?mode=unhandled"));
    report(await callApi("network failure", "http://localhost:9/unreachable"));
    setTimeout(() => { throw new Error("run-all uncaught error"); }, 0);
    void Promise.reject(new Error("run-all unhandled rejection"));
    report(note("run-all", "finished"));
    setRunning(false);
  }

  return (
    <>
      <p>
        <button className="primary" disabled={running} onClick={runAll}>Generate every signal</button>
      </p>
      <div className="grid">
        <IdentitySection report={report} />
        <TracesSection report={report} />
        <LogsSection report={report} />
        <MetricsSection report={report} />
        <ErrorsSection report={report} />
        <ActionsSection report={report} />
        <ReplaySection report={report} />
      </div>
      <h2>Output</h2>
      <ul className="output">
        {entries.map((e) => (
          <li key={e.id}><b>{e.label}</b> <code>{e.status}</code> <span className="muted">{e.detail}</span></li>
        ))}
      </ul>
    </>
  );
}
