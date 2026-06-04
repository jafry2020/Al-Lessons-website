"use client";

import { useState } from "react";
import { Check, X } from "lucide-react";
import { cn } from "@/lib/cn";

type Anomaly = "dirty-read" | "lost-update" | "write-skew" | "phantom-read";
type Isolation = "read-committed" | "snapshot" | "serializable";

interface Scenario {
  id: string;
  title: string;
  steps: { who: "T1" | "T2"; op: string }[];
  anomaly: Anomaly;
  fixedBy: Isolation;
  explain: string;
}

const SCENARIOS: Scenario[] = [
  {
    id: "double-book",
    title: "Two doctors going off-call at once",
    steps: [
      { who: "T1", op: "SELECT count(*) FROM doctors WHERE oncall = true   → 2" },
      { who: "T2", op: "SELECT count(*) FROM doctors WHERE oncall = true   → 2" },
      { who: "T1", op: "UPDATE doctors SET oncall=false WHERE id=alice" },
      { who: "T2", op: "UPDATE doctors SET oncall=false WHERE id=bob" },
      { who: "T1", op: "COMMIT" },
      { who: "T2", op: "COMMIT" },
    ],
    anomaly: "write-skew",
    fixedBy: "serializable",
    explain:
      "Each transaction read a value that was true at the time, made a decision, then both committed. Neither overwrote the other's write, so it's not a lost update. The premise ('there's still another doctor on call') was invalidated by the other transaction's write. That's write skew — only Serializable isolation prevents it.",
  },
  {
    id: "counter",
    title: "Two API calls incrementing the same counter",
    steps: [
      { who: "T1", op: "SELECT value FROM counters WHERE id=1   → 10" },
      { who: "T2", op: "SELECT value FROM counters WHERE id=1   → 10" },
      { who: "T1", op: "UPDATE counters SET value=11 WHERE id=1" },
      { who: "T2", op: "UPDATE counters SET value=11 WHERE id=1" },
      { who: "T1", op: "COMMIT" },
      { who: "T2", op: "COMMIT" },
    ],
    anomaly: "lost-update",
    fixedBy: "snapshot",
    explain:
      "Both reads saw 10; both wrote 11. One increment is silently lost. Snapshot Isolation with first-committer-wins (or atomic increments / SELECT FOR UPDATE) prevents this. Read Committed alone does not.",
  },
  {
    id: "dirty",
    title: "Reading uncommitted balance during a transfer",
    steps: [
      { who: "T1", op: "BEGIN; UPDATE accounts SET balance = balance - 100 WHERE id=A" },
      { who: "T2", op: "SELECT balance FROM accounts WHERE id=A   → sees -100 amount" },
      { who: "T1", op: "ROLLBACK" },
      { who: "T2", op: "Acts on the value it read; that value never really existed" },
    ],
    anomaly: "dirty-read",
    fixedBy: "read-committed",
    explain:
      "T2 read T1's uncommitted change. T1 then rolled back, so T2 acted on data that never existed. Read Committed already prevents this — it's the lowest useful isolation level.",
  },
  {
    id: "phantom",
    title: "Booking-system finds 'no overlapping bookings' twice",
    steps: [
      { who: "T1", op: "SELECT * FROM bookings WHERE room=5 AND day='Mon'  → 0 rows" },
      { who: "T2", op: "SELECT * FROM bookings WHERE room=5 AND day='Mon'  → 0 rows" },
      { who: "T1", op: "INSERT bookings (room=5, day=Mon, user=alice)" },
      { who: "T2", op: "INSERT bookings (room=5, day=Mon, user=bob)" },
      { who: "T1", op: "COMMIT" },
      { who: "T2", op: "COMMIT" },
    ],
    anomaly: "phantom-read",
    fixedBy: "serializable",
    explain:
      "Each transaction's read decision (no conflicting booking) was invalidated by the other's insert. The result is a phantom — a row that wasn't there when you checked but exists now. Materialized conflict / predicate locking under Serializable is what catches it.",
  },
];

const ANOMALY_LABEL: Record<Anomaly, string> = {
  "dirty-read": "Dirty read",
  "lost-update": "Lost update",
  "write-skew": "Write skew",
  "phantom-read": "Phantom read",
};

const ISO_LABEL: Record<Isolation, string> = {
  "read-committed": "Read Committed",
  snapshot: "Snapshot Isolation",
  serializable: "Serializable",
};

export function SDConcurrencyBugs() {
  const [active, setActive] = useState(0);
  const [step, setStep] = useState(0);
  const [pickAnomaly, setPickAnomaly] = useState<Anomaly | null>(null);
  const [pickIso, setPickIso] = useState<Isolation | null>(null);
  const [revealed, setRevealed] = useState(false);

  const sc = SCENARIOS[active];

  const select = (i: number) => {
    setActive(i);
    setStep(0);
    setPickAnomaly(null);
    setPickIso(null);
    setRevealed(false);
  };

  return (
    <figure className="my-10">
      <div className="overflow-hidden rounded-lg border border-border-subtle bg-surface-raised shadow-md">
        <div className="border-b border-border-subtle bg-subtle px-5 py-3 text-overline uppercase text-text-secondary">
          Concurrency Bug Catcher
        </div>
        <div className="grid gap-5 p-5 md:grid-cols-[1fr_1fr]">
          <div>
            <div className="mb-2 text-overline uppercase text-text-muted">Scenarios</div>
            <div className="space-y-1">
              {SCENARIOS.map((s, i) => (
                <button
                  key={s.id}
                  onClick={() => select(i)}
                  className={cn(
                    "block w-full rounded-sm border px-3 py-2 text-left text-body-sm transition-colors",
                    i === active
                      ? "border-accent-500 bg-accent-50 text-text-primary"
                      : "border-border-subtle bg-surface hover:bg-subtle"
                  )}
                >
                  {s.title}
                </button>
              ))}
            </div>

            <div className="mt-5">
              <div className="mb-2 text-overline uppercase text-text-muted">
                Interleaved execution
              </div>
              <div className="overflow-hidden rounded-sm border border-border-subtle bg-subtle font-mono text-caption">
                {sc.steps.slice(0, step + 1).map((st, i) => (
                  <div
                    key={i}
                    className={cn(
                      "grid grid-cols-[3rem_1fr] gap-2 border-b border-border-subtle px-2 py-1 last:border-b-0",
                      st.who === "T1" ? "bg-accent-50/40" : "bg-warning/10"
                    )}
                  >
                    <span className="font-semibold text-text-primary">{st.who}</span>
                    <span className="text-text-secondary">{st.op}</span>
                  </div>
                ))}
              </div>
              <div className="mt-2 flex gap-2">
                <button
                  onClick={() => setStep((s) => Math.min(sc.steps.length - 1, s + 1))}
                  disabled={step >= sc.steps.length - 1}
                  className="rounded-sm border border-accent-500 bg-accent-500 px-3 py-1 text-body-sm text-white hover:bg-accent-600 disabled:opacity-40"
                >
                  Step →
                </button>
                <button
                  onClick={() => setStep(0)}
                  className="rounded-sm border border-border-strong bg-surface px-3 py-1 text-body-sm hover:bg-subtle"
                >
                  Restart
                </button>
              </div>
            </div>
          </div>

          <div>
            <div className="text-overline uppercase text-text-muted">
              1 · What anomaly is happening?
            </div>
            <div className="mt-1 flex flex-wrap gap-2">
              {(Object.keys(ANOMALY_LABEL) as Anomaly[]).map((a) => {
                const isPicked = pickAnomaly === a;
                const isAnswer = revealed && a === sc.anomaly;
                return (
                  <button
                    key={a}
                    disabled={revealed}
                    onClick={() => setPickAnomaly(a)}
                    className={cn(
                      "rounded-sm border px-3 py-1.5 text-body-sm transition-colors",
                      !revealed && isPicked && "border-accent-500 bg-accent-50 text-text-primary",
                      !revealed && !isPicked && "border-border-strong bg-surface hover:bg-subtle",
                      revealed && isAnswer && "border-success bg-success/15",
                      revealed && isPicked && !isAnswer && "border-danger bg-danger/15"
                    )}
                  >
                    <span className="inline-flex items-center gap-1.5">
                      {revealed && isAnswer && <Check size={12} />}
                      {revealed && isPicked && !isAnswer && <X size={12} />}
                      {ANOMALY_LABEL[a]}
                    </span>
                  </button>
                );
              })}
            </div>

            <div className="mt-5 text-overline uppercase text-text-muted">
              2 · Minimum isolation level that fixes it
            </div>
            <div className="mt-1 flex flex-wrap gap-2">
              {(Object.keys(ISO_LABEL) as Isolation[]).map((iso) => {
                const isPicked = pickIso === iso;
                const isAnswer = revealed && iso === sc.fixedBy;
                return (
                  <button
                    key={iso}
                    disabled={revealed}
                    onClick={() => setPickIso(iso)}
                    className={cn(
                      "rounded-sm border px-3 py-1.5 text-body-sm transition-colors",
                      !revealed && isPicked && "border-accent-500 bg-accent-50 text-text-primary",
                      !revealed && !isPicked && "border-border-strong bg-surface hover:bg-subtle",
                      revealed && isAnswer && "border-success bg-success/15",
                      revealed && isPicked && !isAnswer && "border-danger bg-danger/15"
                    )}
                  >
                    <span className="inline-flex items-center gap-1.5">
                      {revealed && isAnswer && <Check size={12} />}
                      {revealed && isPicked && !isAnswer && <X size={12} />}
                      {ISO_LABEL[iso]}
                    </span>
                  </button>
                );
              })}
            </div>

            <div className="mt-5">
              <button
                onClick={() => setRevealed(true)}
                disabled={!pickAnomaly || !pickIso || revealed}
                className="rounded-sm border border-accent-500 bg-accent-500 px-4 py-1.5 text-body-sm text-white hover:bg-accent-600 disabled:opacity-40"
              >
                Check answers
              </button>
            </div>

            {revealed && (
              <div className="mt-4 rounded-sm border border-border-subtle bg-subtle p-3 text-body-sm text-text-secondary">
                <div className="mb-1 text-overline uppercase text-text-muted">Why</div>
                {sc.explain}
              </div>
            )}
          </div>
        </div>
      </div>
      <figcaption className="mt-3 max-w-prose text-caption text-text-muted">
        Step through the interleaved transactions, then identify the anomaly and the cheapest
        isolation level that prevents it. Higher isolation levels prevent everything lower ones do.
      </figcaption>
    </figure>
  );
}
