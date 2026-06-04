"use client";

import { useState } from "react";
import { cn } from "@/lib/cn";

type Mode = "CP" | "AP";
type NodeId = "A" | "B" | "C";
type Fault = "none" | "drop" | "partition" | "pause";

const NODES: NodeId[] = ["A", "B", "C"];

export function SDNetworkFault() {
  const [mode, setMode] = useState<Mode>("CP");
  const [fault, setFault] = useState<Fault>("none");
  const [values, setValues] = useState<Record<NodeId, string>>({ A: "x=1", B: "x=1", C: "x=1" });
  const [log, setLog] = useState<string[]>([]);

  const reset = () => {
    setValues({ A: "x=1", B: "x=1", C: "x=1" });
    setLog([]);
    setFault("none");
  };

  // Determine which nodes can communicate
  const reachableFrom = (origin: NodeId): NodeId[] => {
    if (fault === "partition") {
      // partition isolates C from A/B
      if (origin === "C") return ["C"];
      return ["A", "B"];
    }
    if (fault === "pause") {
      // node C is paused — unreachable from everyone, including itself
      return NODES.filter((n) => n !== "C");
    }
    if (fault === "drop") {
      // best-effort: drop with 50% probability per peer
      return NODES.filter((n) => n === origin || Math.random() > 0.5);
    }
    return NODES;
  };

  const write = (origin: NodeId, val: string) => {
    const peers = reachableFrom(origin);
    const requiredQuorum = mode === "CP" ? 2 : 1; // CP: majority. AP: write whoever you can.
    if (peers.length < requiredQuorum) {
      setLog((l) =>
        [
          `✗ write at ${origin} REJECTED — only ${peers.length} reachable, need ${requiredQuorum}`,
          ...l,
        ].slice(0, 8)
      );
      return;
    }
    setValues((v) => {
      const next = { ...v };
      for (const p of peers) next[p] = val;
      return next;
    });
    const inconsistent = peers.length < 3;
    setLog((l) =>
      [
        `${inconsistent ? "⚠" : "✓"} write at ${origin} → ${val}, applied to ${peers.join(",")}${
          inconsistent ? " (others diverged)" : ""
        }`,
        ...l,
      ].slice(0, 8)
    );
  };

  const read = (origin: NodeId) => {
    if (fault === "pause" && origin === "C") {
      setLog((l) => [`✗ read at C — node paused`, ...l].slice(0, 8));
      return;
    }
    if (mode === "CP") {
      // Need quorum read
      const peers = reachableFrom(origin);
      if (peers.length < 2) {
        setLog((l) => [`✗ read at ${origin} REJECTED — no quorum`, ...l].slice(0, 8));
        return;
      }
      // return the value that appears in majority
      const vals = peers.map((p) => values[p]);
      setLog((l) =>
        [`✓ read at ${origin} (quorum ${peers.join(",")}) → ${vals[0]}`, ...l].slice(0, 8)
      );
    } else {
      // AP: return local value, even if stale
      setLog((l) => [`✓ read at ${origin} → ${values[origin]} (may be stale)`, ...l].slice(0, 8));
    }
  };

  const consistent = new Set(Object.values(values)).size === 1;

  return (
    <figure className="my-10">
      <div className="overflow-hidden rounded-lg border border-border-subtle bg-surface-raised shadow-md">
        <div className="border-b border-border-subtle bg-subtle px-5 py-3 text-overline uppercase text-text-secondary">
          Network Fault Simulator · 3-node KV store
        </div>
        <div className="space-y-5 p-5">
          <div className="flex flex-wrap items-center gap-3">
            <span className="text-overline uppercase text-text-muted">Mode</span>
            <div className="flex gap-1 rounded-sm border border-border-strong p-0.5">
              {(["CP", "AP"] as Mode[]).map((m) => (
                <button
                  key={m}
                  onClick={() => setMode(m)}
                  className={cn(
                    "rounded-sm px-3 py-1 text-body-sm",
                    mode === m ? "bg-accent-500 text-white" : "text-text-secondary hover:bg-subtle"
                  )}
                >
                  {m}
                </button>
              ))}
            </div>
            <span className="text-caption text-text-muted">
              CP: reject under partition. AP: accept reads/writes anywhere, diverge if needed.
            </span>
          </div>

          <div className="grid gap-3 md:grid-cols-3">
            {NODES.map((n) => {
              const isolated =
                (fault === "partition" && n === "C") || (fault === "pause" && n === "C");
              return (
                <div
                  key={n}
                  className={cn(
                    "rounded-md border p-3",
                    isolated ? "border-danger/60 bg-danger/5" : "border-border-subtle bg-surface"
                  )}
                >
                  <div className="mb-1 flex items-center justify-between">
                    <span className="text-overline uppercase text-text-secondary">Node {n}</span>
                    {isolated && (
                      <span className="rounded-sm bg-danger px-1.5 py-0.5 text-overline uppercase text-white">
                        {fault === "pause" ? "Paused" : "Isolated"}
                      </span>
                    )}
                  </div>
                  <div className="font-mono text-body">{values[n]}</div>
                  <div className="mt-2 flex flex-wrap gap-1">
                    <button
                      onClick={() => write(n, `x=${Math.floor(Math.random() * 90) + 10}`)}
                      className="rounded-sm border border-border-strong bg-surface px-2 py-1 text-caption hover:bg-subtle"
                    >
                      Write
                    </button>
                    <button
                      onClick={() => read(n)}
                      className="rounded-sm border border-border-strong bg-surface px-2 py-1 text-caption hover:bg-subtle"
                    >
                      Read
                    </button>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <span className="text-overline uppercase text-text-muted">Inject fault</span>
            {(["none", "drop", "partition", "pause"] as Fault[]).map((f) => (
              <button
                key={f}
                onClick={() => setFault(f)}
                className={cn(
                  "rounded-sm border px-3 py-1 text-body-sm",
                  fault === f
                    ? "border-warning bg-warning/15 text-text-primary"
                    : "border-border-strong bg-surface hover:bg-subtle"
                )}
              >
                {f === "none"
                  ? "Healthy"
                  : f === "drop"
                    ? "Drop 50% of packets"
                    : f === "partition"
                      ? "Partition C from A,B"
                      : "Pause node C"}
              </button>
            ))}
            <button
              onClick={reset}
              className="ml-auto rounded-sm border border-border-subtle bg-surface px-3 py-1 text-body-sm text-text-muted hover:bg-subtle"
            >
              Reset
            </button>
          </div>

          <div className="grid gap-3 md:grid-cols-[2fr_1fr]">
            <div>
              <div className="mb-2 text-overline uppercase text-text-muted">Event log</div>
              <div className="space-y-1 font-mono text-caption">
                {log.length === 0 && (
                  <div className="text-text-muted">No events yet. Try a write under partition.</div>
                )}
                {log.map((l, i) => (
                  <div
                    key={i}
                    className="rounded-sm border border-border-subtle bg-subtle px-2 py-1"
                  >
                    {l}
                  </div>
                ))}
              </div>
            </div>
            <div
              className={cn(
                "rounded-sm border p-3 text-body-sm",
                consistent ? "border-success/40 bg-success/5" : "border-warning/50 bg-warning/10"
              )}
            >
              <div className="mb-1 text-overline uppercase text-text-muted">Cluster state</div>
              {consistent ? (
                <p>All three nodes agree. Reads from any node return the same value.</p>
              ) : (
                <p>
                  Replicas diverged. In AP, reads can return stale values. In CP, writes would have
                  been rejected to avoid this.
                </p>
              )}
            </div>
          </div>
        </div>
      </div>
      <figcaption className="mt-3 max-w-prose text-caption text-text-muted">
        Partition node C from A and B, then try writing in CP vs AP mode. CP refuses writes that
        can't reach a majority — availability suffers. AP accepts the writes locally — consistency
        suffers. That's the CAP tradeoff, live.
      </figcaption>
    </figure>
  );
}
