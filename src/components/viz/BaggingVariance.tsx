"use client";

import { useMemo, useState } from "react";

/**
 * Bagging variance demo for A2.4.
 *
 * Underlying function: y = sin(x). Each tree is approximated as a piecewise
 * constant fit on a bootstrap sample of 25 points (8 bins). User controls B,
 * the number of trees. Shows:
 *   - the true function (dashed grey)
 *   - each tree's prediction curve (faint blue, alpha low)
 *   - the average of B trees (bold red)
 *   - the spread (min/max envelope) as a band
 */

const W = 720;
const H = 360;
const X_MIN = -3;
const X_MAX = 3;
const Y_MIN = -1.8;
const Y_MAX = 1.8;
const N_POINTS = 25;
const NOISE = 0.3;
const N_BINS = 10;
const MAX_TREES = 50;

const sx = (x: number) => ((x - X_MIN) / (X_MAX - X_MIN)) * W;
const sy = (y: number) => H - ((y - Y_MIN) / (Y_MAX - Y_MIN)) * H;

function mulberry32(seed: number) {
  let a = seed;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function gaussian(rng: () => number): number {
  const u1 = Math.max(rng(), 1e-9);
  const u2 = rng();
  return Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2);
}

function sampleData(): { x: number; y: number }[] {
  const rng = mulberry32(37);
  const pts: { x: number; y: number }[] = [];
  for (let i = 0; i < N_POINTS; i += 1) {
    const x = X_MIN + (X_MAX - X_MIN) * rng();
    pts.push({ x, y: Math.sin(x) + NOISE * gaussian(rng) });
  }
  return pts;
}

/** Piecewise-constant fit: average y in each of N_BINS x-bins. */
function fitBinned(data: { x: number; y: number }[]): number[] {
  const bins: { sum: number; count: number }[] = Array.from({ length: N_BINS }, () => ({
    sum: 0,
    count: 0,
  }));
  for (const d of data) {
    const idx = Math.min(
      N_BINS - 1,
      Math.max(0, Math.floor(((d.x - X_MIN) / (X_MAX - X_MIN)) * N_BINS))
    );
    bins[idx].sum += d.y;
    bins[idx].count += 1;
  }
  // For empty bins, fill with neighbour average (then 0 as fallback).
  const means = bins.map((b) => (b.count > 0 ? b.sum / b.count : NaN));
  for (let i = 0; i < N_BINS; i += 1) {
    if (Number.isNaN(means[i])) {
      // Find nearest non-nan
      let l = i - 1;
      let r = i + 1;
      while (l >= 0 && Number.isNaN(means[l])) l -= 1;
      while (r < N_BINS && Number.isNaN(means[r])) r += 1;
      const lv = l >= 0 ? means[l] : NaN;
      const rv = r < N_BINS ? means[r] : NaN;
      means[i] =
        !Number.isNaN(lv) && !Number.isNaN(rv)
          ? (lv + rv) / 2
          : !Number.isNaN(lv)
            ? lv
            : !Number.isNaN(rv)
              ? rv
              : 0;
    }
  }
  return means;
}

function bootstrap(
  data: { x: number; y: number }[],
  rng: () => number
): { x: number; y: number }[] {
  const out: { x: number; y: number }[] = [];
  for (let i = 0; i < data.length; i += 1) {
    const idx = Math.floor(rng() * data.length);
    out.push(data[idx]);
  }
  return out;
}

function predict(bins: number[], x: number): number {
  const idx = Math.min(
    N_BINS - 1,
    Math.max(0, Math.floor(((x - X_MIN) / (X_MAX - X_MIN)) * N_BINS))
  );
  return bins[idx];
}

export function BaggingVariance() {
  const data = useMemo(() => sampleData(), []);
  const [B, setB] = useState(1);

  // Precompute all MAX_TREES trees once; user just changes how many to use.
  const allTrees = useMemo(() => {
    const rng = mulberry32(101);
    const trees: number[][] = [];
    for (let t = 0; t < MAX_TREES; t += 1) {
      trees.push(fitBinned(bootstrap(data, rng)));
    }
    return trees;
  }, [data]);

  const usedTrees = allTrees.slice(0, B);

  // Sample 100 x-values for plotting.
  const N_PLOT = 200;
  const xs = useMemo(
    () => Array.from({ length: N_PLOT }, (_, i) => X_MIN + (i / (N_PLOT - 1)) * (X_MAX - X_MIN)),
    []
  );

  // True curve.
  const truePath = xs.map((x) => `${sx(x)},${sy(Math.sin(x))}`).join(" ");

  // Each tree's prediction path.
  const treePaths = usedTrees.map((bins) =>
    xs.map((x) => `${sx(x)},${sy(predict(bins, x))}`).join(" ")
  );

  // Average and envelope.
  const avgPath = xs
    .map((x) => {
      const preds = usedTrees.map((bins) => predict(bins, x));
      const avg = preds.reduce((a, b) => a + b, 0) / preds.length;
      return `${sx(x)},${sy(avg)}`;
    })
    .join(" ");

  // Compute average MSE: avg over xs of (avg_pred - true)^2
  const mseAvg =
    xs.reduce((s, x) => {
      const preds = usedTrees.map((bins) => predict(bins, x));
      const avg = preds.reduce((a, b) => a + b, 0) / preds.length;
      return s + (avg - Math.sin(x)) ** 2;
    }, 0) / xs.length;

  // Avg individual tree MSE
  const mseInd =
    usedTrees.reduce(
      (sum, bins) =>
        sum + xs.reduce((s, x) => s + (predict(bins, x) - Math.sin(x)) ** 2, 0) / xs.length,
      0
    ) / usedTrees.length;

  return (
    <figure className="my-10">
      <div className="overflow-hidden rounded-lg border border-border-subtle bg-surface-raised shadow-md">
        <svg viewBox={`0 0 ${W} ${H}`} className="block h-auto w-full">
          <line x1={0} y1={sy(0)} x2={W} y2={sy(0)} stroke="rgb(var(--border-subtle))" />
          <line x1={sx(0)} y1={0} x2={sx(0)} y2={H} stroke="rgb(var(--border-subtle))" />

          {/* True curve */}
          <polyline
            points={truePath}
            fill="none"
            stroke="rgb(var(--text-muted))"
            strokeWidth={1.5}
            strokeDasharray="6 5"
          />

          {/* Individual trees (faint) */}
          {treePaths.map((pts, i) => (
            <polyline
              key={`t-${i}`}
              points={pts}
              fill="none"
              stroke="rgb(var(--viz-3))"
              strokeOpacity={0.18}
              strokeWidth={1}
            />
          ))}

          {/* Average */}
          <polyline
            points={avgPath}
            fill="none"
            stroke="rgb(var(--accent-500))"
            strokeWidth={2.75}
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>

        <div className="border-t border-border-subtle bg-surface p-4">
          <label className="flex flex-wrap items-center gap-3">
            <span className="text-overline uppercase text-text-muted">Number of trees (B)</span>
            <input
              type="range"
              min={1}
              max={MAX_TREES}
              step={1}
              value={B}
              onChange={(e) => setB(parseInt(e.target.value, 10))}
              className="w-64 accent-accent-500"
            />
            <span className="w-10 font-mono text-h4 text-text-primary">{B}</span>
          </label>

          <div className="mt-4 grid grid-cols-2 gap-4 sm:grid-cols-2">
            <Metric label="Avg single-tree MSE" value={mseInd} tone="muted" />
            <Metric label="Ensemble MSE" value={mseAvg} tone="accent" />
          </div>

          <p className="mt-3 text-body-sm text-text-secondary">
            {B === 1
              ? "With one tree, the prediction is noisy — every bin is shaped by a few random samples."
              : B < 10
                ? "A handful of trees: the average is smoother but still wobbly."
                : B < 25
                  ? "Variance shrinks fast — the average closely tracks the true sine curve."
                  : "Diminishing returns: further trees mostly correct already-cancelled noise."}
          </p>
        </div>
      </div>
      <figcaption className="mt-3 max-w-prose text-caption text-text-muted">
        Each faint blue curve is one piecewise-constant tree fit on a bootstrap sample. The bold red
        curve is the average of B trees. The dashed grey curve is the true function. Watch the
        ensemble MSE drop as B grows, then plateau.
      </figcaption>
    </figure>
  );
}

function Metric({
  label,
  value,
  tone,
}: {
  label: string;
  value: number;
  tone: "accent" | "muted";
}) {
  const color = tone === "accent" ? "rgb(var(--accent-500))" : "rgb(var(--text-muted))";
  return (
    <div className="rounded-sm border border-border-subtle bg-canvas p-3">
      <div className="text-overline uppercase text-text-muted">{label}</div>
      <div className="mt-1 font-mono text-h4" style={{ color }}>
        {value.toFixed(4)}
      </div>
    </div>
  );
}
