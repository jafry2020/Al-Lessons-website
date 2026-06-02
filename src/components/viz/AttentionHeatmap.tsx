"use client";

import { useMemo, useState } from "react";

/**
 * Attention heatmap demo for A5.4.
 *
 * Shows a small attention matrix (8 tokens) for an illustrative sentence.
 * User can toggle between presets:
 *   - "uniform": all weights equal (baseline)
 *   - "diagonal": each token attends to itself (identity)
 *   - "previous": each attends to the previous token (n-gram style)
 *   - "causal": triangular mask with realistic distribution
 *   - "all-to-all": realistic dense attention pattern
 *
 * Rows = queries (tokens making the decision); columns = keys/values (tokens
 * being attended to). Brightness encodes weight.
 */

const TOKENS = ["the", "cat", "sat", "on", "the", "warm", "mat", "."];
const N = TOKENS.length;
const CELL = 44;

type PatternKey = "uniform" | "diagonal" | "previous" | "causal" | "realistic";

const PATTERN_LABELS: Record<PatternKey, { label: string; description: string }> = {
  uniform: {
    label: "Uniform",
    description:
      "All weights equal — every query attends to every key equally. The baseline 'no attention preference' state.",
  },
  diagonal: {
    label: "Diagonal (self)",
    description:
      "Each token attends only to itself. Useful for showing the identity case; corresponds to a 'pass-through' attention head.",
  },
  previous: {
    label: "Previous token",
    description:
      "Each token attends to the previous one. Classic n-gram pattern; BERT and GPT have heads that approximate this.",
  },
  causal: {
    label: "Causal (LM-style)",
    description:
      "Strict causal mask: each token can only attend to itself and earlier tokens. Required for autoregressive language modelling.",
  },
  realistic: {
    label: "Realistic dense",
    description:
      "A representative dense attention head: strong self-attention, some focus on syntactically related tokens, soft distribution elsewhere.",
  },
};

function buildPattern(pattern: PatternKey): number[][] {
  const M: number[][] = Array.from({ length: N }, () => new Array<number>(N).fill(0));
  if (pattern === "uniform") {
    const v = 1 / N;
    for (let i = 0; i < N; i += 1) for (let j = 0; j < N; j += 1) M[i][j] = v;
    return M;
  }
  if (pattern === "diagonal") {
    for (let i = 0; i < N; i += 1) M[i][i] = 1;
    return M;
  }
  if (pattern === "previous") {
    for (let i = 0; i < N; i += 1) {
      if (i > 0) M[i][i - 1] = 0.85;
      M[i][i] = 0.15;
    }
    M[0][0] = 1;
    return M;
  }
  if (pattern === "causal") {
    for (let i = 0; i < N; i += 1) {
      // Recency-decayed, normalized over j <= i
      const raw: number[] = [];
      for (let j = 0; j <= i; j += 1) raw.push(Math.exp(-(i - j) * 0.5));
      const sum = raw.reduce((a, b) => a + b, 0);
      for (let j = 0; j <= i; j += 1) M[i][j] = raw[j] / sum;
    }
    return M;
  }
  // "realistic" — hand-crafted plausible pattern
  // "the cat sat on the warm mat ."
  // Subjects attend to verbs; adjectives to nouns; etc.
  const HAND: number[][] = [
    [0.5, 0.3, 0.05, 0.05, 0.04, 0.02, 0.02, 0.02], // the0 → cat
    [0.05, 0.5, 0.25, 0.05, 0.02, 0.05, 0.05, 0.03], // cat → sat
    [0.05, 0.4, 0.4, 0.05, 0.02, 0.02, 0.03, 0.03], // sat → cat
    [0.02, 0.05, 0.4, 0.4, 0.05, 0.03, 0.03, 0.02], // on → sat
    [0.02, 0.05, 0.05, 0.2, 0.3, 0.05, 0.3, 0.03], // the → mat
    [0.02, 0.03, 0.03, 0.05, 0.05, 0.4, 0.4, 0.02], // warm → mat
    [0.02, 0.1, 0.1, 0.05, 0.1, 0.15, 0.4, 0.08], // mat → cat (subject) + warm + self
    [0.05, 0.1, 0.1, 0.05, 0.1, 0.1, 0.2, 0.3], // . → mat + self
  ];
  return HAND;
}

export function AttentionHeatmap() {
  const [pattern, setPattern] = useState<PatternKey>("realistic");
  const matrix = useMemo(() => buildPattern(pattern), [pattern]);
  const cfg = PATTERN_LABELS[pattern];

  return (
    <figure className="my-10">
      <div className="overflow-hidden rounded-lg border border-border-subtle bg-surface-raised shadow-md">
        <div className="flex flex-wrap gap-2 border-b border-border-subtle bg-surface p-3">
          {(Object.keys(PATTERN_LABELS) as PatternKey[]).map((k) => (
            <button
              key={k}
              onClick={() => setPattern(k)}
              className={`rounded-sm border px-3 py-1 text-body-sm ${
                k === pattern
                  ? "border-accent-500 bg-accent-500/10 text-accent-500"
                  : "border-border-subtle text-text-secondary"
              }`}
            >
              {PATTERN_LABELS[k].label}
            </button>
          ))}
        </div>

        <div className="p-4">
          <div className="mb-3 text-overline uppercase text-text-muted">
            Attention weights (rows = queries, columns = keys/values)
          </div>
          <div
            className="inline-block"
            style={{
              display: "grid",
              gridTemplateColumns: `${CELL}px repeat(${N}, ${CELL}px)`,
              gridTemplateRows: `${CELL}px repeat(${N}, ${CELL}px)`,
            }}
          >
            {/* Top-left empty */}
            <div />
            {/* Column headers */}
            {TOKENS.map((t, j) => (
              <div
                key={`ch-${j}`}
                style={{ width: CELL, height: CELL }}
                className="flex items-center justify-center text-body-sm text-text-secondary"
              >
                {t}
              </div>
            ))}
            {/* Rows */}
            {TOKENS.map((tRow, i) => (
              <>
                <div
                  key={`rh-${i}`}
                  style={{ width: CELL, height: CELL }}
                  className="flex items-center justify-center text-body-sm text-text-secondary"
                >
                  {tRow}
                </div>
                {TOKENS.map((_, j) => {
                  const v = matrix[i][j];
                  const alpha = Math.max(0, Math.min(1, v));
                  // Diagonal slightly highlighted with accent
                  const baseRGB = i === j ? "var(--accent-500)" : "var(--viz-2)";
                  return (
                    <div
                      key={`c-${i}-${j}`}
                      style={{
                        width: CELL,
                        height: CELL,
                        backgroundColor: `rgba(${alpha > 0.001 ? `var(--${i === j ? "accent" : "viz"}-rgb)` : "0,0,0"}, ${alpha})`,
                        background: `rgb(${baseRGB} / ${alpha})`,
                        border: "1px solid rgb(var(--border-subtle))",
                      }}
                      className="flex items-center justify-center font-mono text-[10px]"
                    >
                      <span style={{ color: alpha > 0.5 ? "white" : "rgb(var(--text-primary))" }}>
                        {v.toFixed(2)}
                      </span>
                    </div>
                  );
                })}
              </>
            ))}
          </div>
        </div>

        <div className="border-t border-border-subtle bg-surface p-4">
          <p className="text-body-sm text-text-secondary">{cfg.description}</p>
        </div>
      </div>
      <figcaption className="mt-3 max-w-prose text-caption text-text-muted">
        Each row is a query position; each column is a key/value position. The value is the
        attention weight — what fraction of that position&apos;s value is mixed into the output.
        Real attention heads show patterns ranging from highly local (previous-token) to broadly
        distributed (semantic).
      </figcaption>
    </figure>
  );
}
