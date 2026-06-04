"use client";

import { useState } from "react";
import { Check, X } from "lucide-react";
import { cn } from "@/lib/cn";

type Model = "relational" | "document" | "graph";

interface Scenario {
  id: string;
  title: string;
  detail: string;
  best: Model;
  explain: Record<Model, string>;
}

const SCENARIOS: Scenario[] = [
  {
    id: "ecom",
    title: "E-commerce product catalog with strict reporting",
    detail:
      "Millions of products with shared attributes (price, SKU, stock). Finance needs nightly aggregates joined against orders, returns, and tax tables.",
    best: "relational",
    explain: {
      relational:
        "Best fit. Stable schema, lots of many-to-many joins (products↔categories↔suppliers↔orders), and reporting queries thrive on SQL.",
      document:
        "Plausible for the product page itself, but the cross-collection joins finance needs become painful in document DBs.",
      graph:
        "Overkill. The relationships are shallow and tabular, not deeply connected. A graph DB would add complexity without payoff.",
    },
  },
  {
    id: "social",
    title: "Social network friend-of-friend recommendations",
    detail:
      "Users connect to users. The hot query is 'find people connected to me within 2–3 hops, ranked by mutual friends'.",
    best: "graph",
    explain: {
      relational:
        "Possible but ugly — multi-hop traversal forces self-joins that explode in cost as the graph grows.",
      document:
        "Document stores don't model many-to-many gracefully. Embedding friend lists duplicates data and breaks under updates.",
      graph:
        "Best fit. Nodes for users, edges for friendships, native traversal queries (Cypher, Gremlin) make multi-hop cheap and expressive.",
    },
  },
  {
    id: "profile",
    title: "User profiles where each user has variable skills, jobs, certifications",
    detail:
      "A LinkedIn-style profile. Each user has 0..N skills, 0..N jobs, 0..N certifications, and the shape varies. Most reads load one whole profile at a time.",
    best: "document",
    explain: {
      relational:
        "Workable but high impedance mismatch — each profile load fans out into several joins, and the schema feels too rigid for evolving fields.",
      document:
        "Best fit. The 'aggregate' (one profile = one document) matches how the app reads and writes. Variable shapes are natural.",
      graph:
        "Overkill — the data isn't deeply connected. Most queries are 'show me one profile', not 'traverse from this profile through 5 hops'.",
    },
  },
];

const MODEL_LABEL: Record<Model, string> = {
  relational: "Relational (SQL)",
  document: "Document (JSON)",
  graph: "Graph",
};

export function SDDataModelPicker() {
  const [picks, setPicks] = useState<Record<string, Model | undefined>>({});
  const [revealed, setRevealed] = useState<Record<string, boolean>>({});

  return (
    <figure className="my-10">
      <div className="overflow-hidden rounded-lg border border-border-subtle bg-surface-raised shadow-md">
        <div className="border-b border-border-subtle bg-subtle px-5 py-3 text-overline uppercase text-text-secondary">
          Pick a data model for each scenario
        </div>
        <div className="space-y-5 p-5">
          {SCENARIOS.map((s) => {
            const pick = picks[s.id];
            const isRevealed = revealed[s.id];
            const correct = pick === s.best;
            return (
              <div key={s.id} className="rounded-md border border-border-subtle bg-surface p-4">
                <h4 className="mb-1 text-h4">{s.title}</h4>
                <p className="mb-3 text-body-sm text-text-secondary">{s.detail}</p>
                <div className="flex flex-wrap gap-2">
                  {(["relational", "document", "graph"] as Model[]).map((m) => {
                    const isPicked = pick === m;
                    const isAnswer = isRevealed && m === s.best;
                    return (
                      <button
                        key={m}
                        disabled={isRevealed}
                        onClick={() => {
                          setPicks((p) => ({ ...p, [s.id]: m }));
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
                          {MODEL_LABEL[m]}
                        </span>
                      </button>
                    );
                  })}
                </div>
                {isRevealed && (
                  <div className="mt-3 grid gap-2 rounded-sm border border-border-subtle bg-subtle p-3 text-body-sm text-text-secondary md:grid-cols-3">
                    {(Object.keys(s.explain) as Model[]).map((m) => (
                      <div key={m}>
                        <div
                          className={cn(
                            "mb-1 text-overline uppercase",
                            m === s.best ? "text-success" : "text-text-muted"
                          )}
                        >
                          {MODEL_LABEL[m]}
                        </div>
                        <p>{s.explain[m]}</p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
      <figcaption className="mt-3 max-w-prose text-caption text-text-muted">
        Real systems are rarely pure — relational DBs now store JSON columns, document DBs add
        joins, graph DBs talk SQL. The decision is about the <em>dominant</em> access pattern.
      </figcaption>
    </figure>
  );
}
