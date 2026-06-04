"use client";

import { useState } from "react";

interface Entry {
  key: string;
  value: string;
  offset: number;
  tombstone?: boolean;
}

const SEED: Entry[] = [
  { key: "user:42", value: "alice", offset: 0 },
  { key: "user:17", value: "bob", offset: 1 },
  { key: "user:42", value: "alice2", offset: 2 },
  { key: "user:99", value: "carol", offset: 3 },
];

export function SDStorageEngineSim() {
  const [log, setLog] = useState<Entry[]>(SEED);
  const [key, setKey] = useState("user:42");
  const [value, setValue] = useState("");
  const [queryKey, setQueryKey] = useState("user:42");
  const [useIndex, setUseIndex] = useState(true);
  const [scanLog, setScanLog] = useState<string[]>([]);

  const nextOffset = log.length;

  const append = () => {
    if (!key) return;
    setLog((l) => [...l, { key, value: value || "(empty)", offset: nextOffset }]);
    setValue("");
  };

  const remove = () => {
    if (!key) return;
    setLog((l) => [...l, { key, value: "⌀", offset: nextOffset, tombstone: true }]);
  };

  const compact = () => {
    const latest = new Map<string, Entry>();
    for (const e of log) latest.set(e.key, e);
    const kept = [...latest.values()]
      .filter((e) => !e.tombstone)
      .map((e, i) => ({ ...e, offset: i }));
    setLog(kept);
  };

  const reset = () => {
    setLog(SEED);
    setScanLog([]);
  };

  // Build hash index from log: key → latest offset
  const index = new Map<string, number>();
  log.forEach((e, i) => index.set(e.key, i));

  const lookup = () => {
    const trace: string[] = [];
    if (useIndex) {
      const off = index.get(queryKey);
      if (off === undefined) {
        trace.push(`Index miss → key not found`);
      } else {
        trace.push(`Index lookup → offset ${off}`);
        const e = log[off];
        trace.push(
          e.tombstone
            ? `Read offset ${off}: tombstone → not found`
            : `Read offset ${off}: value = "${e.value}" ✓`
        );
      }
    } else {
      trace.push(`Full scan begins (no index)`);
      let found: Entry | null = null;
      for (let i = 0; i < log.length; i += 1) {
        trace.push(`  scan offset ${i}: ${log[i].key}`);
        if (log[i].key === queryKey) found = log[i];
      }
      trace.push(
        found
          ? found.tombstone
            ? `Latest record was tombstone → not found`
            : `Latest match value = "${found.value}" ✓`
          : `No match after ${log.length} reads`
      );
    }
    setScanLog(trace);
  };

  return (
    <figure className="my-10">
      <div className="overflow-hidden rounded-lg border border-border-subtle bg-surface-raised shadow-md">
        <div className="border-b border-border-subtle bg-subtle px-5 py-3 text-overline uppercase text-text-secondary">
          Append-only log · key-value store internals
        </div>
        <div className="grid gap-5 p-5 md:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
          <div>
            <div className="mb-2 text-overline uppercase text-text-muted">Write</div>
            <div className="flex flex-col gap-2 sm:flex-row">
              <input
                value={key}
                onChange={(e) => setKey(e.target.value)}
                className="rounded-sm border border-border-strong bg-surface px-2 py-1 font-mono text-body-sm"
                placeholder="key"
              />
              <input
                value={value}
                onChange={(e) => setValue(e.target.value)}
                className="flex-1 rounded-sm border border-border-strong bg-surface px-2 py-1 font-mono text-body-sm"
                placeholder="value"
              />
            </div>
            <div className="mt-2 flex flex-wrap gap-2">
              <button
                onClick={append}
                className="rounded-sm border border-accent-500 bg-accent-500 px-3 py-1 text-body-sm text-white hover:bg-accent-600"
              >
                Append
              </button>
              <button
                onClick={remove}
                className="rounded-sm border border-border-strong bg-surface px-3 py-1 text-body-sm hover:bg-subtle"
              >
                Delete (tombstone)
              </button>
              <button
                onClick={compact}
                className="rounded-sm border border-border-strong bg-surface px-3 py-1 text-body-sm hover:bg-subtle"
              >
                Compact
              </button>
              <button
                onClick={reset}
                className="rounded-sm border border-border-subtle bg-surface px-3 py-1 text-body-sm text-text-muted hover:bg-subtle"
              >
                Reset
              </button>
            </div>

            <div className="mt-5 text-overline uppercase text-text-muted">Query</div>
            <div className="mt-1 flex flex-wrap items-center gap-2">
              <input
                value={queryKey}
                onChange={(e) => setQueryKey(e.target.value)}
                className="rounded-sm border border-border-strong bg-surface px-2 py-1 font-mono text-body-sm"
              />
              <label className="flex items-center gap-1 text-body-sm text-text-secondary">
                <input
                  type="checkbox"
                  checked={useIndex}
                  onChange={(e) => setUseIndex(e.target.checked)}
                />
                use hash index
              </label>
              <button
                onClick={lookup}
                className="rounded-sm border border-accent-500 bg-accent-500 px-3 py-1 text-body-sm text-white hover:bg-accent-600"
              >
                Look up
              </button>
            </div>
            {scanLog.length > 0 && (
              <pre className="mt-3 max-h-44 overflow-y-auto rounded-sm border border-border-subtle bg-subtle p-3 font-mono text-caption text-text-secondary">
                {scanLog.join("\n")}
              </pre>
            )}
          </div>

          <div className="grid gap-3 md:grid-cols-2">
            <div>
              <div className="mb-2 flex items-baseline justify-between">
                <span className="text-overline uppercase text-text-muted">Log file</span>
                <span className="text-caption text-text-muted">{log.length} records</span>
              </div>
              <div className="max-h-72 overflow-y-auto rounded-sm border border-border-subtle bg-subtle p-2 font-mono text-caption">
                {log.map((e, i) => (
                  <div
                    key={i}
                    className={
                      e.tombstone
                        ? "py-0.5 text-danger"
                        : index.get(e.key) === i
                          ? "py-0.5 text-text-primary"
                          : "py-0.5 text-text-muted line-through"
                    }
                  >
                    [{i.toString().padStart(2, "0")}] {e.key} → {e.value}
                  </div>
                ))}
              </div>
            </div>

            <div>
              <div className="mb-2 text-overline uppercase text-text-muted">Hash index</div>
              <div className="max-h-72 overflow-y-auto rounded-sm border border-border-subtle bg-subtle p-2 font-mono text-caption">
                {[...index.entries()].map(([k, off]) => (
                  <div key={k} className="py-0.5 text-text-primary">
                    {k} → @{off}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
      <figcaption className="mt-3 max-w-prose text-caption text-text-muted">
        Writes are O(1) appends. The hash index turns lookups from O(n) scans into O(1) reads. Old
        versions accumulate as garbage until <em>compaction</em> rewrites the log keeping only the
        latest value for each key.
      </figcaption>
    </figure>
  );
}
