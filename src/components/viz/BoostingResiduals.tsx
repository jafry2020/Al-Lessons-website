"use client";

import { useMemo, useState } from "react";

/**
 * Gradient boosting residual viewer for A2.5.
 *
 * 1D regression on y = sin(x) + noise. Each "tree" is a 6-bin piecewise-constant
 * regressor fit to the current residuals. Slider chooses iteration m (0..20).
 * Two stacked panels:
 *   Top: current ensemble prediction F_m vs. truth.
 *   Bottom: residuals at iteration m and the tree fit to them.
 */

const W = 720;
const H = 200;
const X_MIN = -3;
const X_MAX = 3;
const Y_TOP_MIN = -1.8;
const Y_TOP_MAX = 1.8;
const Y_RES_RANGE = 1.5;
const N_BINS = 6;
const N_POINTS = 30;
const NOISE = 0.25;
const LR = 0.4; // learning rate
const MAX_ITERS = 20;

const sx = (x: number) => ((x - X_MIN) / (X_MAX - X_MIN)) * W;
const syTop = (y: number) => H - ((y - Y_TOP_MIN) / (Y_TOP_MAX - Y_TOP_MIN)) * H;
const syRes = (y: number) => H - ((y + Y_RES_RANGE) / (2 * Y_RES_RANGE)) * H;

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
  const rng = mulberry32(57);
  const pts: { x: number; y: number }[] = [];
  for (let i = 0; i < N_POINTS; i += 1) {
    const x = X_MIN + (X_MAX - X_MIN) * rng();
    pts.push({ x, y: Math.sin(x) + NOISE * gaussian(rng) });
  }
  return pts;
}

function binIndex(x: number): number {
  return Math.min(N_BINS - 1, Math.max(0, Math.floor(((x - X_MIN) / (X_MAX - X_MIN)) * N_BINS)));
}

function fitBins(data: { x: number; y: number }[]): number[] {
  const sums = new Array<number>(N_BINS).fill(0);
  const cnts = new Array<number>(N_BINS).fill(0);
  for (const d of data) {
    const idx = binIndex(d.x);
    sums[idx] += d.y;
    cnts[idx] += 1;
  }
  return sums.map((s, i) => (cnts[i] > 0 ? s / cnts[i] : 0));
}

interface Iter {
  prediction: number[]; // F_m at each data point
  residual: number[]; // y - F_m
  tree: number[]; // per-bin prediction
}

export function BoostingResiduals() {
  const data = useMemo(() => sampleData(), []);
  const [m, setM] = useState(0);

  // Run all iterations once.
  const iterations: Iter[] = useMemo(() => {
    const meanY = data.reduce((s, d) => s + d.y, 0) / data.length;
    const F = new Array<number>(data.length).fill(meanY);
    const iters: Iter[] = [];
    for (let i = 0; i <= MAX_ITERS; i += 1) {
      const residual = data.map((d, k) => d.y - F[k]);
      // Fit a "tree" to residuals
      const tree = fitBins(data.map((d, k) => ({ x: d.x, y: residual[k] })));
      iters.push({ prediction: [...F], residual, tree });
      // Update F
      for (let k = 0; k < data.length; k += 1) {
        F[k] = F[k] + LR * tree[binIndex(data[k].x)];
      }
    }
    return iters;
  }, [data]);

  const current = iterations[m];

  // Predict F at any x using all trees up to iteration m.
  const predictF = (x: number): number => {
    const meanY = data.reduce((s, d) => s + d.y, 0) / data.length;
    let f = meanY;
    for (let i = 0; i < m; i += 1) {
      f += LR * iterations[i].tree[binIndex(x)];
    }
    return f;
  };

  // Build piecewise-constant paths.
  const N_PLOT = 240;
  const xs = Array.from({ length: N_PLOT }, (_, i) => X_MIN + (i / (N_PLOT - 1)) * (X_MAX - X_MIN));

  const truePath = xs.map((x) => `${sx(x)},${syTop(Math.sin(x))}`).join(" ");
  const predPath = xs.map((x) => `${sx(x)},${syTop(predictF(x))}`).join(" ");
  const treePath = xs.map((x) => `${sx(x)},${syRes(current.tree[binIndex(x)])}`).join(" ");

  // Train MSE at this iteration
  const trainMse =
    data.reduce((s, d, k) => s + (d.y - current.prediction[k]) ** 2, 0) / data.length;

  return (
    <figure className="my-10">
      <div className="overflow-hidden rounded-lg border border-border-subtle bg-surface-raised shadow-md">
        {/* Top panel: ensemble vs truth */}
        <div className="p-4">
          <div className="text-overline uppercase text-text-muted">
            Top: ensemble F_{m}(x) (red) vs truth sin(x) (dashed grey)
          </div>
          <svg viewBox={`0 0 ${W} ${H}`} className="mt-2 block h-auto w-full">
            <line x1={0} y1={syTop(0)} x2={W} y2={syTop(0)} stroke="rgb(var(--border-subtle))" />
            <polyline
              points={truePath}
              fill="none"
              stroke="rgb(var(--text-muted))"
              strokeWidth={1.5}
              strokeDasharray="6 5"
            />
            <polyline
              points={predPath}
              fill="none"
              stroke="rgb(var(--accent-500))"
              strokeWidth={2.5}
            />
            {data.map((d, i) => (
              <circle
                key={`d-${i}`}
                cx={sx(d.x)}
                cy={syTop(d.y)}
                r={3.5}
                fill="rgb(var(--viz-3))"
              />
            ))}
          </svg>
        </div>

        {/* Bottom panel: residuals + tree */}
        <div className="border-t border-border-subtle p-4">
          <div className="text-overline uppercase text-text-muted">
            Bottom: residuals at iteration {m} (dots) and the next tree's fit (blue)
          </div>
          <svg viewBox={`0 0 ${W} ${H}`} className="mt-2 block h-auto w-full">
            <line x1={0} y1={syRes(0)} x2={W} y2={syRes(0)} stroke="rgb(var(--border-subtle))" />
            {/* bin boundaries */}
            {Array.from({ length: N_BINS - 1 }).map((_, i) => {
              const x = X_MIN + ((i + 1) / N_BINS) * (X_MAX - X_MIN);
              return (
                <line
                  key={`b-${i}`}
                  x1={sx(x)}
                  y1={0}
                  x2={sx(x)}
                  y2={H}
                  stroke="rgb(var(--border-subtle))"
                  strokeDasharray="2 4"
                />
              );
            })}
            <polyline points={treePath} fill="none" stroke="rgb(var(--viz-2))" strokeWidth={2.5} />
            {data.map((d, i) => (
              <circle
                key={`r-${i}`}
                cx={sx(d.x)}
                cy={syRes(current.residual[i])}
                r={3.5}
                fill="rgb(var(--warning))"
              />
            ))}
          </svg>
        </div>

        <div className="border-t border-border-subtle bg-surface p-4">
          <label className="flex flex-wrap items-center gap-3">
            <span className="text-overline uppercase text-text-muted">Iteration m</span>
            <input
              type="range"
              min={0}
              max={MAX_ITERS}
              step={1}
              value={m}
              onChange={(e) => setM(parseInt(e.target.value, 10))}
              className="w-64 accent-accent-500"
            />
            <span className="w-10 font-mono text-h4 text-text-primary">{m}</span>
          </label>

          <div className="mt-4 grid grid-cols-2 gap-4">
            <Metric label="Train MSE" value={trainMse} />
            <Metric label="Learning rate η" value={LR} digits={2} />
          </div>

          <p className="mt-3 text-body-sm text-text-secondary">
            {m === 0
              ? "Iteration 0: the ensemble is just the mean. The bottom panel shows the initial residuals — that's what the first tree will fit."
              : m < 5
                ? "Each tree carves the residuals into bins and the ensemble starts to take shape."
                : m < 12
                  ? "Residuals are shrinking; the ensemble closely tracks the truth."
                  : "Late iterations chase noise more than signal — this is where you stop in practice."}
          </p>
        </div>
      </div>
      <figcaption className="mt-3 max-w-prose text-caption text-text-muted">
        Each tree fits the residuals left by the current ensemble. The ensemble is the cumulative
        sum (with learning rate η) of all trees so far. Watch the residuals shrink as m grows.
      </figcaption>
    </figure>
  );
}

function Metric({ label, value, digits = 4 }: { label: string; value: number; digits?: number }) {
  return (
    <div className="rounded-sm border border-border-subtle bg-canvas p-3">
      <div className="text-overline uppercase text-text-muted">{label}</div>
      <div className="mt-1 font-mono text-h4 text-accent-500">{value.toFixed(digits)}</div>
    </div>
  );
}
