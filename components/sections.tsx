"use client";

import HyperDX from "@hyperdx/browser";
import { useActionState, useState } from "react";
import { ErrorBoundary } from "react-error-boundary";
import { submitFeedback, type FeedbackState } from "@/app/actions";
import { callApi, note, post, type Entry } from "@/lib/client/api";
import { USERS } from "@/lib/users";
import { Section } from "./Section";

// Route React render errors from every ErrorBoundary into HyperDX.
HyperDX.attachToReactErrorBoundary(ErrorBoundary);

export type Report = (entry: Entry) => void;
type Props = { report: Report };

export function IdentitySection({ report }: Props) {
  const [userId, setUserId] = useState("");

  function identify(id: string) {
    setUserId(id);
    const user = USERS.find((u) => u.id === id);
    if (!user) return;
    HyperDX.setGlobalAttributes({
      userId: user.id,
      userEmail: user.email,
      userName: user.name,
      teamName: user.teamName,
      plan: user.plan,
    });
    report(note("identify", `setGlobalAttributes for ${user.name} (${user.plan})`));
  }

  return (
    <Section title="User identity" hint="setGlobalAttributes: every later browser event carries the user.">
      <select value={userId} onChange={(e) => identify(e.target.value)} aria-label="Pick a user">
        <option value="">Anonymous</option>
        {USERS.map((u) => (
          <option key={u.id} value={u.id}>{`${u.name} (${u.plan})`}</option>
        ))}
      </select>
    </Section>
  );
}

export function TracesSection({ report }: Props) {
  const user = () => USERS[1].id;
  return (
    <Section title="Traces" hint="Browser fetch spans linked to server spans through traceparent.">
      <button onClick={async () => report(await callApi("trace chain", `/api/trace/chain?user=${user()}`))}>
        Browser to API to API
      </button>
      <button onClick={async () => report(await callApi("slow request", "/api/slow?ms=1500"))}>
        Slow request (1.5 s)
      </button>
      <button
        onClick={async () =>
          (await Promise.all([1, 2, 3].map((n) => callApi(`fan-out ${n}`, `/api/trace/chain?user=u-${n}`)))).forEach(report)
        }
      >
        Parallel fan-out
      </button>
      <a href="/server-render">Server Component render</a>
    </Section>
  );
}

export function LogsSection({ report }: Props) {
  const levels = ["debug", "info", "warn", "error"] as const;
  return (
    <Section title="Logs" hint="Browser console capture, plus server winston and console logs.">
      <button
        onClick={() => {
          console.log("client log", { area: "demo" });
          console.info("client info", { area: "demo" });
          console.warn("client warn", { area: "demo" });
          console.error("client error", { area: "demo" });
          report(note("browser console", "log, info, warn, error"));
        }}
      >
        Browser console logs
      </button>
      {levels.map((level) => (
        <button
          key={level}
          onClick={async () =>
            report(await callApi(`server ${level} log`, "/api/logs", post({ level, message: `demo ${level}`, fields: { area: "demo" } })))
          }
        >
          Server {level}
        </button>
      ))}
    </Section>
  );
}

export function MetricsSection({ report }: Props) {
  const send = async (kind: string, value?: number) => report(await callApi(`metric ${kind}`, "/api/metrics", post({ kind, value })));
  return (
    <Section title="Metrics" hint="Custom counter, histogram, up-down counter and gauge, plus runtime and host metrics.">
      <button onClick={() => send("click")}>Counter +1</button>
      <button onClick={() => send("duration")}>Histogram sample</button>
      <button onClick={() => send("queue_up")}>Queue +1</button>
      <button onClick={() => send("queue_down")}>Queue -1</button>
    </Section>
  );
}

function Bomb({ armed }: { armed: boolean }) {
  if (armed) throw new Error("React render error: component crashed");
  return <span className="muted">Component is healthy</span>;
}

export function ErrorsSection({ report }: Props) {
  const [armed, setArmed] = useState(false);
  return (
    <Section title="Errors and exceptions" hint="Uncaught errors, rejections, render errors, manual exceptions, failed requests, server 500s.">
      <button onClick={() => setTimeout(() => { throw new Error("Uncaught error from a timer"); }, 0)}>
        Uncaught JS error
      </button>
      <button onClick={() => void Promise.reject(new Error("Unhandled promise rejection"))}>
        Unhandled rejection
      </button>
      <button
        onClick={() => {
          HyperDX.recordException(new Error("Handled client exception"), { area: "demo", handled: "true" });
          report(note("recordException", "Handled client exception"));
        }}
      >
        recordException
      </button>
      <button onClick={async () => report(await callApi("network failure", "http://localhost:9/unreachable"))}>
        Failed request
      </button>
      <button onClick={async () => report(await callApi("server 404", "/api/does-not-exist"))}>Server 404</button>
      <button onClick={async () => report(await callApi("server handled", "/api/errors/server?mode=handled"))}>
        Server error (handled)
      </button>
      <button onClick={async () => report(await callApi("server unhandled", "/api/errors/server?mode=unhandled"))}>
        Server error (unhandled)
      </button>
      <button onClick={() => setArmed(true)}>React render error</button>
      <ErrorBoundary
        resetKeys={[armed]}
        fallback={<span className="error">Boundary caught the error <button onClick={() => setArmed(false)}>Reset</button></span>}
      >
        <Bomb armed={armed} />
      </ErrorBoundary>
    </Section>
  );
}

function FeedbackForm() {
  const [state, formAction, pending] = useActionState<FeedbackState, FormData>(submitFeedback, { ok: true, message: "" });
  return (
    <form action={formAction} className="form">
      <input name="message" placeholder='Feedback (type "fail" to throw)' aria-label="Feedback" />
      <button disabled={pending}>Send via server action</button>
      {state.message && <span className={state.ok ? "muted" : "error"}>{state.message}</span>}
    </form>
  );
}

export function ActionsSection({ report }: Props) {
  return (
    <Section title="Custom actions and server actions" hint="addAction events, and a server action traced end to end.">
      <button
        onClick={() => {
          HyperDX.addAction("Form-Completed", { formId: "signup-form", formName: "Signup Form", formType: "signup" });
          report(note("addAction", "Form-Completed"));
        }}
      >
        addAction
      </button>
      <ErrorBoundary
        fallbackRender={({ resetErrorBoundary }) => (
          <span className="error">
            Server action failed <button onClick={resetErrorBoundary}>Reset</button>
          </span>
        )}
      >
        <FeedbackForm />
      </ErrorBoundary>
    </Section>
  );
}

export function ReplaySection({ report }: Props) {
  const [network, setNetwork] = useState(true);
  return (
    <Section title="Session replay and network capture" hint="Replay records this page. Masked and blocked elements are hidden in the recording.">
      <button onClick={() => report(note("session", HyperDX.getSessionUrl() ?? HyperDX.getSessionId() ?? "no session"))}>
        Show session link
      </button>
      <button onClick={() => { HyperDX.stopSessionRecorder(); report(note("replay", "recording stopped")); }}>Stop recording</button>
      <button onClick={() => { HyperDX.resumeSessionRecorder(); report(note("replay", "recording resumed")); }}>Resume recording</button>
      <button
        onClick={() => {
          if (network) HyperDX.disableAdvancedNetworkCapture(); else HyperDX.enableAdvancedNetworkCapture();
          setNetwork(!network);
          report(note("network capture", network ? "bodies and headers off" : "bodies and headers on"));
        }}
      >
        Network bodies: {network ? "on" : "off"}
      </button>
      <input className="hdx-mask" defaultValue="4242 4242 4242 4242" aria-label="Masked in replay" />
      <span className="hdx-block muted">Blocked from replay entirely</span>
    </Section>
  );
}
