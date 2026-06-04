"use client";

import { useMemo, useState } from "react";
import { cn } from "@/lib/cn";

type Strategy = "range-time" | "hash-user" | "range-user";

interface Order {
  userId: number;
  timestamp: number; // hour offset 0..23
}

// 1000 orders skewed: a couple of celebrity users + a daily spike at hour 12
const ORDERS: Order[] = (() => {
  const arr: Order[] = [];
  const seed = (n: number) => {
    let x = n;
    return () => {
      x = (x * 9301 + 49297) % 233280;
      return x / 233280;
    };
  };
  const rand = seed(42);
  for (let i = 0; i < 1000; i += 1) {
    // 30% of orders concentrated in hour 12 (lunch spike)
    const ts = rand() < 0.3 ? 12 : Math.floor(rand() * 24);
    // 25% from one celebrity user (#1), otherwise random user 2..50
    const uid = rand() < 0.25 ? 1 : 2 + Math.floor(rand() * 49);
    arr.push({ userId: uid, timestamp: ts });
  }
  return arr;
})();

const NUM_SHARDS = 6;

function fnv(n: number): number {
  let h = 2166136261;
  h ^= n;
  h = Math.imul(h, 16777619);
  return h >>> 0;
}

function shardOf(o: Order, strat: Strategy): number {
  if (strat === "range-time") return Math.floor(o.timestamp / (24 / NUM_SHARDS));
  if (strat === "range-user") return Math.min(NUM_SHARDS - 1, Math.floor((o.userId - 1) / 9));
  return fnv(o.userId) % NUM_SHARDS;
}

const LABEL: Record<Strategy, string> = {
  "range-time": "Range by timestamp",
  "hash-user": "Hash of user_id",
  "range-user": "Range by user_id",
};

const HINT: Record<Strategy, string> = {
  "range-time":
    "Hot spot. The current hour is always pounding one shard; lunch-spike hour gets crushed. Range queries by time are cheap, but writes pile on a single node.",
  "hash-user":
    "Even distribution across shards — except for the celebrity user, whose hash still maps to one shard. The celebrity problem doesn't disappear; you contain it.",
  "range-user":
    "Newer user IDs cluster on one shard (the high end). Range queries by user_id are easy; balance is poor.",
};

export function SDShardDesigner() {
  const [strategy, setStrategy] = useState<Strategy>("range-time");

  const counts = useMemo(() => {
    const c = new Array(NUM_SHARDS).fill(0) as number[];
    for (const o of ORDERS) c[shardOf(o, strategy)] += 1;
    return c;
  }, [strategy]);

  const max = Math.max(...counts);
  const min = Math.min(...counts);
  const skew = ((max - min) / (ORDERS.length / NUM_SHARDS)) * 100;

  return (
    <figure className="my-10">
      <div className="overflow-hidden rounded-lg border border-border-subtle bg-surface-raised shadow-md">
        <div className="border-b border-border-subtle bg-subtle px-5 py-3 text-overline uppercase text-text-secondary">
          Shard Designer · 1000 orders, 6 shards
        </div>
        <div className="space-y-5 p-5">
          <div className="flex flex-wrap gap-2">
            {(Object.keys(LABEL) as Strategy[]).map((s) => (
              <button
                key={s}
                onClick={() => setStrategy(s)}
                className={cn(
                  "rounded-sm border px-3 py-1.5 text-body-sm transition-colors",
                  strategy === s
                    ? "border-accent-500 bg-accent-500 text-white"
                    : "border-border-strong bg-surface hover:bg-subtle"
                )}
              >
                {LABEL[s]}
              </button>
            ))}
          </div>

          <div className="grid grid-cols-6 items-end gap-2">
            {counts.map((c, i) => {
              const pct = (c / max) * 100;
              const hot = c > (ORDERS.length / NUM_SHARDS) * 1.5;
              return (
                <div key={i} className="flex flex-col items-center gap-1">
                  <div className="relative h-40 w-full overflow-hidden rounded-sm border border-border-subtle bg-subtle">
                    <div
                      className={cn(
                        "absolute bottom-0 left-0 right-0 transition-all",
                        hot ? "bg-danger" : "bg-accent-500"
                      )}
                      style={{ height: `${pct}%` }}
                    />
                  </div>
                  <div className="text-caption text-text-muted">Shard {i}</div>
                  <div className="font-mono text-caption text-text-primary">{c}</div>
                </div>
              );
            })}
          </div>

          <div className="rounded-sm border border-border-subtle bg-subtle p-3 text-body-sm text-text-secondary">
            <div className="mb-1 text-overline uppercase text-text-muted">
              Skew = {skew.toFixed(0)}% above mean
            </div>
            {HINT[strategy]}
          </div>
        </div>
      </div>
      <figcaption className="mt-3 max-w-prose text-caption text-text-muted">
        Red bars = hot shards (more than 1.5× the average load). The dataset has a celebrity user
        (~25% of orders) and a lunch-hour spike — both are common in real workloads, and they expose
        the limits of each partitioning strategy.
      </figcaption>
    </figure>
  );
}
