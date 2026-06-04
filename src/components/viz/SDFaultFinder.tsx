"use client";

import { useState } from "react";
import { Check, X } from "lucide-react";
import { cn } from "@/lib/cn";

type FaultKind = "hardware" | "software" | "human";

interface Scenario {
  id: string;
  text: string;
  kind: FaultKind;
  mitigation: string;
  explain: string;
}

const SCENARIOS: Scenario[] = [
  {
    id: "s1",
    text: "At 3am, a hard disk in the database server fails. The on-call engineer is paged.",
    kind: "hardware",
    mitigation: "Run on replicated storage so a single disk failure is invisible to users.",
    explain:
      "Disks fail — MTTF measured in years, but with thousands of disks you lose one a day. Replication + RAID + multi-AZ are the standard answers.",
  },
  {
    id: "s2",
    text: "A developer pushes a config change to production that points the app at the staging database.",
    kind: "human",
    mitigation: "Staged rollouts, config diffs in PR review, and quick rollback paths.",
    explain:
      "Kleppmann: humans are the leading cause of outages. Design systems that make the right thing easy and the wrong thing hard.",
  },
  {
    id: "s3",
    text: "A leap-second triggers a kernel bug that hangs every Linux box in the fleet simultaneously.",
    kind: "software",
    mitigation:
      "Process supervision, graceful degradation, and the assumption that 'correlated software failure' is real.",
    explain:
      "Software faults are nastier than hardware because they're correlated — one trigger takes down many machines at once. Cascading failures live here.",
  },
  {
    id: "s4",
    text: "A memory leak slowly fills RAM over 12 days until requests start OOM-killing.",
    kind: "software",
    mitigation: "Resource monitoring, watchdogs, periodic restarts of long-running processes.",
    explain:
      "Latent software bugs that wake up under unusual conditions are a major source of incidents. Tests rarely catch them.",
  },
  {
    id: "s5",
    text: "A DBA runs a migration during business hours; the table lock blocks all writes for 4 minutes.",
    kind: "human",
    mitigation: "Online schema-change tools, off-peak windows, and pre-flight load testing.",
    explain:
      "A correct command issued at the wrong time is still an outage. Operational tooling should make blast-radius obvious before the human commits.",
  },
  {
    id: "s6",
    text: "A network switch in the rack starts dropping 5% of packets silently.",
    kind: "hardware",
    mitigation: "Multi-path networking and aggressive health checks at the application layer.",
    explain:
      "Hardware doesn't always fail cleanly. Partial failures — slow disks, flaky NICs — are harder to detect than total failures.",
  },
];

const KIND_LABEL: Record<FaultKind, string> = {
  hardware: "Hardware fault",
  software: "Software error",
  human: "Human error",
};

export function SDFaultFinder() {
  const [picks, setPicks] = useState<Record<string, FaultKind | undefined>>({});
  const [revealed, setRevealed] = useState<Record<string, boolean>>({});

  const score = SCENARIOS.reduce(
    (n, s) => n + (revealed[s.id] && picks[s.id] === s.kind ? 1 : 0),
    0
  );
  const answered = Object.values(revealed).filter(Boolean).length;

  return (
    <figure className="my-10">
      <div className="overflow-hidden rounded-lg border border-border-subtle bg-surface-raised shadow-md">
        <div className="border-b border-border-subtle bg-subtle px-5 py-3 text-overline uppercase text-text-secondary">
          Fault Finder · classify each incident
        </div>
        <div className="space-y-4 p-5">
          {SCENARIOS.map((s) => {
            const pick = picks[s.id];
            const isRevealed = revealed[s.id];
            const correct = pick === s.kind;
            return (
              <div
                key={s.id}
                className={cn(
                  "rounded-md border p-4 transition-colors",
                  !isRevealed && "border-border-subtle bg-surface",
                  isRevealed && correct && "border-success/60 bg-success/5",
                  isRevealed && !correct && "border-danger/60 bg-danger/5"
                )}
              >
                <p className="mb-3 text-body text-text-primary">{s.text}</p>
                <div className="flex flex-wrap gap-2">
                  {(["hardware", "software", "human"] as FaultKind[]).map((k) => {
                    const isPicked = pick === k;
                    const isAnswer = isRevealed && k === s.kind;
                    return (
                      <button
                        key={k}
                        disabled={isRevealed}
                        onClick={() => {
                          setPicks((p) => ({ ...p, [s.id]: k }));
                          setRevealed((r) => ({ ...r, [s.id]: true }));
                        }}
                        className={cn(
                          "rounded-sm border px-3 py-1.5 text-body-sm transition-colors",
                          !isRevealed &&
                            "border-border-strong bg-surface hover:border-accent-300 hover:bg-subtle",
                          isRevealed &&
                            isAnswer &&
                            "border-success bg-success/15 text-text-primary",
                          isRevealed &&
                            isPicked &&
                            !correct &&
                            "border-danger bg-danger/15 text-text-primary",
                          isRevealed && !isPicked && !isAnswer && "border-border-subtle opacity-50"
                        )}
                      >
                        <span className="inline-flex items-center gap-1.5">
                          {isRevealed && isAnswer && <Check size={12} />}
                          {isRevealed && isPicked && !correct && <X size={12} />}
                          {KIND_LABEL[k]}
                        </span>
                      </button>
                    );
                  })}
                </div>
                {isRevealed && (
                  <div className="mt-3 space-y-2 rounded-sm border border-border-subtle bg-subtle p-3 text-body-sm text-text-secondary">
                    <p>{s.explain}</p>
                    <p>
                      <span className="text-overline uppercase text-text-muted">Mitigation</span>
                      <br />
                      {s.mitigation}
                    </p>
                  </div>
                )}
              </div>
            );
          })}
        </div>
        <div className="border-t border-border-subtle bg-subtle px-5 py-3 text-body-sm text-text-secondary">
          Score: <strong>{score}</strong> / {SCENARIOS.length} ({answered} answered)
        </div>
      </div>
      <figcaption className="mt-3 max-w-prose text-caption text-text-muted">
        The three categories aren't airtight — a bad config push could be argued as either a human
        error or a software gap that allowed it. The reflex Kleppmann wants you to build: name the
        root cause before reaching for the fix.
      </figcaption>
    </figure>
  );
}
