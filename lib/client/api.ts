export type Entry = { id: number; label: string; status: string; detail: string };

let counter = 0;

/** Calls our own API and returns a log entry for the output panel. */
export async function callApi(label: string, path: string, init?: RequestInit): Promise<Entry> {
  try {
    const res = await fetch(path, init);
    const text = await res.text();
    return { id: ++counter, label, status: String(res.status), detail: text.slice(0, 240) };
  } catch (err) {
    return { id: ++counter, label, status: "network error", detail: (err as Error).message };
  }
}

export function note(label: string, detail: string): Entry {
  return { id: ++counter, label, status: "ok", detail };
}

export const post = (body: unknown): RequestInit => ({
  method: "POST",
  headers: { "content-type": "application/json" },
  body: JSON.stringify(body),
});
