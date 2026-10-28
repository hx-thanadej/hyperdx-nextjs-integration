import type { ReactNode } from "react";

export function Section({ title, hint, children }: { title: string; hint: string; children: ReactNode }) {
  return (
    <section className="card">
      <h2>{title}</h2>
      <p className="hint">{hint}</p>
      <div className="row">{children}</div>
    </section>
  );
}
