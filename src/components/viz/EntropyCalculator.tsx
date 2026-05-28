"use client";

import { useMemo, useState } from "react";

/**
 * Entropy calculator for the information-theory lesson.
 *
 * Four outcomes, each with a weight slider. Weights auto-normalize to a
 * valid probability distribution. Displays:
 *   - A bar chart of the probability distribution.
 *   - Shannon entropy H = −Σ p·log₂(p) in bits.
 *   - Entropy as a fraction of maximum entropy (log₂ 4 = 2 bits).
 *   - Per-outcome surprise −log₂(p) (information content).
 *
 * Students can see that the uniform distribution maximises entropy, any
 * concentration of probability reduces it, and a deterministic distribution
 * (one outcome gets all weight) drives entropy to zero.
 */

const W = 680;
const H = 220;
const L = 12;
const R = 12;
const T = 16;
const B = 40;
const PLOT_W = W - L - R;
const PLOT_H = H - T - B;

const OUTCOME_LABELS = ["A", "B", "C", "D"];
const MAX_ENTROPY = Math.log2(4); // 2 bits

export function EntropyCalculator() {
  // Weights — user adjusts; we normalise to probabilities.
  const [weights, setWeights] = useState<[number, number, number, number]>([1, 1, 1, 1]);

  const total = weights.reduce((s, w) => s + w, 0);
  const probs = weights.map((w) => w / total) as [number, number, number, number];

  // Shannon entropy H = -Σ p log₂ p.
  const entropy = useMemo(
    () => probs.reduce((h, p) => (p > 0 ? h - p * Math.log2(p) : h), 0),
    [probs]
  );

  // Per-outcome information content.
  const surprises = probs.map((p) => (p > 0 ? -Math.log2(p) : 0));

  const entropyFrac = entropy / MAX_ENTROPY; // 0 → 1

  // Colours for the four outcomes.
  const barColors = [
    "rgb(var(--accent-500))",
    "rgb(var(--viz-2))",
    "rgb(var(--viz-3))",
    "rgb(var(--viz-7))",
  ];

  // Bar chart: uniform bars anchored at bottom.
  const barW = (PLOT_W / 4) * 0.55;
  const gap = (PLOT_W / 4) * 0.45;

  function setWeight(i: number, v: number) {
    const next = [...weights] as [number, number, number, number];
    next[i] = Math.max(0.01, v);
    setWeights(next);
  }

  return (
    <figure className="my-10">
      <div className="overflow-hidden rounded-lg border border-border-subtle bg-surface-raised shadow-md">
        <div className="grid gap-0 md:grid-cols-[minmax(0,1fr)_280px]">
          {/* Bar chart */}
          <div className="border-b border-border-subtle md:border-b-0 md:border-r">
            <svg
              viewBox={`0 0 ${W} ${H}`}
              className="block h-auto w-full"
              aria-label="Probability distribution bar chart"
            >
              {/* Baseline */}
              <line
                x1={L}
                y1={T + PLOT_H}
                x2={L + PLOT_W}
                y2={T + PLOT_H}
                stroke="rgb(var(--border-subtle))"
                strokeWidth={1}
              />

              {/* Reference lines at 0.25, 0.5, 0.75 */}
              {[0.25, 0.5, 0.75].map((r) => {
                const y = T + PLOT_H - r * PLOT_H;
                return (
                  <g key={r}>
                    <line
                      x1={L}
                      y1={y}
                      x2={L + PLOT_W}
                      y2={y}
                      stroke="rgb(var(--border-subtle))"
                      strokeWidth={0.75}
                      strokeDasharray="3 3"
                    />
                    <text x={L + PLOT_W + 4} y={y + 4} fontSize={10} fill="rgb(var(--text-muted))">
                      {r.toFixed(2)}
                    </text>
                  </g>
                );
              })}

              {/* Bars */}
              {probs.map((p, i) => {
                const bx = L + i * (PLOT_W / 4) + gap / 2;
                const bh = p * PLOT_H;
                const by = T + PLOT_H - bh;
                return (
                  <g key={i}>
                    <rect
                      x={bx}
                      y={by}
                      width={barW}
                      height={bh}
                      fill={barColors[i]}
                      opacity={0.85}
                      rx={3}
                    />
                    <text
                      x={bx + barW / 2}
                      y={by - 6}
                      textAnchor="middle"
                      fontSize={12}
                      fontWeight={600}
                      fill="rgb(var(--text-primary))"
                    >
                      {(p * 100).toFixed(0)}%
                    </text>
                    <text
                      x={bx + barW / 2}
                      y={T + PLOT_H + 18}
                      textAnchor="middle"
                      fontSize={13}
                      fontWeight={600}
                      fill={barColors[i]}
                    >
                      {OUTCOME_LABELS[i]}
                    </text>
                    <text
                      x={bx + barW / 2}
                      y={T + PLOT_H + 32}
                      textAnchor="middle"
                      fontSize={10}
                      fill="rgb(var(--text-muted))"
                    >
                      {surprises[i].toFixed(2)} bits
                    </text>
                  </g>
                );
              })}
            </svg>
          </div>

          {/* Sliders + entropy readout */}
          <div className="flex flex-col gap-4 p-5">
            <div className="text-overline uppercase text-text-muted">Adjust weights</div>
            {weights.map((w, i) => (
              <label key={i} className="flex items-center gap-3">
                <span
                  className="flex h-6 w-6 shrink-0 items-center justify-center rounded text-body-sm font-bold text-white"
                  style={{ background: barColors[i] }}
                >
                  {OUTCOME_LABELS[i]}
                </span>
                <input
                  type="range"
                  min={0.01}
                  max={10}
                  step={0.01}
                  value={w}
                  onChange={(e) => setWeight(i, parseFloat(e.target.value))}
                  className="flex-1 accent-accent-500"
                />
                <span className="w-8 text-right font-mono text-body-sm text-text-secondary">
                  {w.toFixed(1)}
                </span>
              </label>
            ))}

            {/* Entropy display */}
            <div className="mt-2 rounded-md border border-accent-100 bg-accent-50 p-3">
              <div className="text-overline uppercase text-accent-700">Shannon Entropy H</div>
              <div className="mt-1 flex items-baseline gap-2">
                <span className="font-mono text-display text-accent-600">{entropy.toFixed(3)}</span>
                <span className="text-body-sm text-text-secondary">bits</span>
              </div>
              <div className="mt-2 text-body-sm text-text-secondary">
                Max entropy: {MAX_ENTROPY.toFixed(3)} bits (uniform)
              </div>
              {/* Entropy fraction bar */}
              <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-subtle">
                <div
                  className="h-full rounded-full bg-accent-500 transition-all duration-200"
                  style={{ width: `${entropyFrac * 100}%` }}
                />
              </div>
              <div className="mt-1 text-caption text-text-muted">
                {(entropyFrac * 100).toFixed(0)}% of maximum
              </div>
            </div>

            {/* Quick presets */}
            <div className="flex gap-2">
              <button
                onClick={() => setWeights([1, 1, 1, 1])}
                className="flex-1 rounded border border-border-subtle bg-subtle py-1 text-caption text-text-secondary hover:bg-surface-raised"
              >
                Uniform
              </button>
              <button
                onClick={() => setWeights([10, 0.01, 0.01, 0.01])}
                className="flex-1 rounded border border-border-subtle bg-subtle py-1 text-caption text-text-secondary hover:bg-surface-raised"
              >
                Peaked
              </button>
              <button
                onClick={() => setWeights([4, 3, 2, 1])}
                className="flex-1 rounded border border-border-subtle bg-subtle py-1 text-caption text-text-secondary hover:bg-surface-raised"
              >
                Skewed
              </button>
            </div>
          </div>
        </div>
      </div>
      <figcaption className="mt-3 max-w-prose text-caption text-text-muted">
        Drag the sliders to concentrate probability on fewer outcomes and watch entropy fall. Click
        "Peaked" to see entropy near zero; "Uniform" to restore the maximum of 2 bits. The numbers
        below each bar show the surprise −log₂(p) for that outcome — rare events are more
        surprising.
      </figcaption>
    </figure>
  );
}
