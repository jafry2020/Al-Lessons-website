"use client";

import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/cn";

type Node = { id: string; label: string; value: string; pending: { val: string; eta: number }[] };

type ReadFrom = "leader" | "any-follower";

export function SDReplicationLag() {
  const [lagMs, setLagMs] = useState(1500);
  const [readFrom, setReadFrom] = useState<ReadFrom>("any-follower");
  const [readOwnWrites, setReadOwnWrites] = useState(false);
  const [leader, setLeader] = useState<Node>({
    id: "L",
    label: "Leader",
    value: "cat.jpg",
    pending: [],
  });
  const [followers, setFollowers] = useState<Node[]>([
    { id: "F1", label: "Follower 1", value: "cat.jpg", pending: [] },
    { id: "F2", label: "Follower 2", value: "cat.jpg", pending: [] },
  ]);
  const [pendingFlush, setPendingFlush] = useState(0);
  const [lastWriteAt, setLastWriteAt] = useState<number | null>(null);
  const [reads, setReads] = useState<{ from: string; saw: string; stale: boolean }[]>([]);
  const tickRef = useRef<number | null>(null);

  // Drive replication by advancing pending writes' ETAs each tick.
  useEffect(() => {
    tickRef.current = window.setInterval(() => {
      setFollowers((fs) =>
        fs.map((f) => {
          const now = Date.now();
          const due = f.pending.filter((p) => p.eta <= now);
          const remaining = f.pending.filter((p) => p.eta > now);
          const latest = due[due.length - 1];
          return { ...f, value: latest ? latest.val : f.value, pending: remaining };
        })
      );
      setPendingFlush((n) => n + 1);
    }, 200);
    return () => {
      if (tickRef.current) clearInterval(tickRef.current);
    };
  }, []);

  const write = (val: string) => {
    setLeader((l) => ({ ...l, value: val }));
    setLastWriteAt(Date.now());
    const eta = Date.now() + lagMs;
    setFollowers((fs) => fs.map((f) => ({ ...f, pending: [...f.pending, { val, eta }] })));
  };

  const read = () => {
    let from: Node;
    if (readFrom === "leader") {
      from = leader;
    } else if (readOwnWrites && lastWriteAt && Date.now() - lastWriteAt < lagMs) {
      // "read your own writes" fix: route reads to leader for a window after writing
      from = leader;
    } else {
      from = followers[Math.floor(Math.random() * followers.length)];
    }
    const stale = from.value !== leader.value;
    setReads((r) =>
      [
        { from: from.label + (from.id === "L" ? "" : ` (${from.id})`), saw: from.value, stale },
        ...r,
      ].slice(0, 6)
    );
  };

  // re-render dependency so progress bars track time
  void pendingFlush;

  const now = Date.now();

  return (
    <figure className="my-10">
      <div className="overflow-hidden rounded-lg border border-border-subtle bg-surface-raised shadow-md">
        <div className="border-b border-border-subtle bg-subtle px-5 py-3 text-overline uppercase text-text-secondary">
          Replication Lag Simulator
        </div>
        <div className="space-y-5 p-5">
          {/* Topology */}
          <div className="grid gap-3 md:grid-cols-3">
            <NodeCard node={leader} isLeader leaderValue={leader.value} now={now} />
            {followers.map((f) => (
              <NodeCard key={f.id} node={f} leaderValue={leader.value} now={now} />
            ))}
          </div>

          {/* Controls */}
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <label className="block text-body-sm">
                Replication lag: <strong className="font-mono">{lagMs} ms</strong>
              </label>
              <input
                type="range"
                min={100}
                max={5000}
                step={100}
                value={lagMs}
                onChange={(e) => setLagMs(Number(e.target.value))}
                className="mt-1 w-full accent-accent-500"
              />
              <div className="mt-3 flex flex-wrap gap-2">
                <button
                  onClick={() => write("hat.jpg")}
                  className="rounded-sm border border-accent-500 bg-accent-500 px-3 py-1 text-body-sm text-white hover:bg-accent-600"
                >
                  Write "hat.jpg"
                </button>
                <button
                  onClick={() => write("party.jpg")}
                  className="rounded-sm border border-accent-500 bg-accent-500 px-3 py-1 text-body-sm text-white hover:bg-accent-600"
                >
                  Write "party.jpg"
                </button>
                <button
                  onClick={read}
                  className="rounded-sm border border-border-strong bg-surface px-3 py-1 text-body-sm hover:bg-subtle"
                >
                  Read
                </button>
              </div>
            </div>

            <div className="space-y-2 text-body-sm">
              <label className="flex items-center gap-2">
                <input
                  type="radio"
                  checked={readFrom === "any-follower"}
                  onChange={() => setReadFrom("any-follower")}
                />
                Read from any follower (cheap, may be stale)
              </label>
              <label className="flex items-center gap-2">
                <input
                  type="radio"
                  checked={readFrom === "leader"}
                  onChange={() => setReadFrom("leader")}
                />
                Read from leader (expensive, always fresh)
              </label>
              <label className="flex items-center gap-2 border-t border-border-subtle pt-2">
                <input
                  type="checkbox"
                  checked={readOwnWrites}
                  onChange={(e) => setReadOwnWrites(e.target.checked)}
                  disabled={readFrom === "leader"}
                />
                "Read your own writes" — after writing, route reads to leader for {lagMs}ms
              </label>
            </div>
          </div>

          {/* Reads log */}
          <div>
            <div className="mb-2 text-overline uppercase text-text-muted">Recent reads</div>
            <div className="space-y-1 font-mono text-caption">
              {reads.length === 0 && (
                <div className="text-text-muted">No reads yet. Write then read.</div>
              )}
              {reads.map((r, i) => (
                <div
                  key={i}
                  className={cn(
                    "rounded-sm border px-2 py-1",
                    r.stale
                      ? "border-warning/50 bg-warning/10 text-text-primary"
                      : "border-success/40 bg-success/5 text-text-secondary"
                  )}
                >
                  {r.from} → "{r.saw}" {r.stale ? "· STALE" : "· fresh"}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
      <figcaption className="mt-3 max-w-prose text-caption text-text-muted">
        Async replication is fast but gives readers no guarantee of freshness. Drag the lag up,
        write, immediately read from a follower — you'll see the old value. Toggle "read your own
        writes" to feel the standard fix.
      </figcaption>
    </figure>
  );
}

function NodeCard({
  node,
  isLeader = false,
  leaderValue,
  now,
}: {
  node: Node;
  isLeader?: boolean;
  leaderValue: string;
  now: number;
}) {
  const stale = !isLeader && node.value !== leaderValue;
  const pending = node.pending[0];
  const remaining = pending ? Math.max(0, pending.eta - now) : 0;
  return (
    <div
      className={cn(
        "rounded-md border p-3",
        isLeader
          ? "border-accent-500/60 bg-accent-50"
          : stale
            ? "border-warning/50 bg-warning/10"
            : "border-success/40 bg-success/5"
      )}
    >
      <div className="flex items-center justify-between">
        <span className="text-overline uppercase text-text-secondary">{node.label}</span>
        {isLeader && (
          <span className="rounded-sm bg-accent-500 px-1.5 py-0.5 text-overline uppercase text-white">
            Leader
          </span>
        )}
      </div>
      <div className="mt-1 font-mono text-body">{node.value}</div>
      {!isLeader && pending && (
        <div className="mt-2">
          <div className="text-caption text-text-muted">
            applying "{pending.val}" in {remaining}ms
          </div>
          <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-border-subtle">
            <div
              className="h-full bg-accent-500 transition-all"
              style={{
                width: `${Math.max(0, 100 - (remaining / (pending.eta - (pending.eta - 5000))) * 100)}%`,
              }}
            />
          </div>
        </div>
      )}
    </div>
  );
}
