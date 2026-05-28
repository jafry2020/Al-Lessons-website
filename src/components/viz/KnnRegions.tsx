"use client";

import { useMemo, useState } from "react";

/**
 * kNN decision regions widget for A2.7.
 *
 * 2D scatter with two classes. User controls k via slider. Background is
 * shaded by majority class among the k nearest training points at a grid of
 * positions across the plane.
 */

const W = 640;
const H = 360;
const X_MIN = -3;
const X_MAX = 3;
const Y_MIN = -2;
const Y_MAX = 2;
const GRID = 56;
const MAX_K = 25;

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

interface Pt {
  x: number;
  y: number;
  c: 0 | 1;
}

function sampleData(): Pt[] {
  const rng = mulberry32(41);
  const pts: Pt[] = [];
  // Two clusters per class to make boundary interesting
  for (let i = 0; i < 18; i += 1) {
    pts.push({ x: -1.5 + 0.55 * gaussian(rng), y: 0.7 + 0.45 * gaussian(rng), c: 0 });
  }
  for (let i = 0; i < 12; i += 1) {
    pts.push({ x: 0.5 + 0.4 * gaussian(rng), y: -1 + 0.4 * gaussian(rng), c: 0 });
  }
  for (let i = 0; i < 18; i += 1) {
    pts.push({ x: 1.3 + 0.5 * gaussian(rng), y: 0.6 + 0.45 * gaussian(rng), c: 1 });
  }
  for (let i = 0; i < 12; i += 1) {
    pts.push({ x: -0.8 + 0.4 * gaussian(rng), y: -1.1 + 0.4 * gaussian(rng), c: 1 });
  }
  return pts;
}

function knnPredict(data: Pt[], x: number, y: number, k: number): 0 | 1 {
  const dists = data.map((p) => ({ d: (p.x - x) ** 2 + (p.y - y) ** 2, c: p.c }));
  dists.sort((a, b) => a.d - b.d);
  let c1 = 0;
  for (let i = 0; i < k && i < dists.length; i += 1) c1 += dists[i].c;
  return c1 > k / 2 ? 1 : 0;
}

export function KnnRegions() {
  const data = useMemo(() => sampleData(), []);
  const [k, setK] = useState(5);

  const cellW = W / GRID;
  const cellH = H / Math.round(GRID * (H / W));
  const rows = Math.round(GRID * (H / W));

  // Compute grid predictions
  const grid = useMemo(() => {
    const out: { c: 0 | 1; row: number; col: number }[] = [];
    for (let i = 0; i < GRID; i += 1) {
      for (let j = 0; j < rows; j += 1) {
        const x = X_MIN + ((i + 0.5) / GRID) * (X_MAX - X_MIN);
        const y = Y_MIN + ((j + 0.5) / rows) * (Y_MAX - Y_MIN);
        out.push({ c: knnPredict(data, x, y, k), col: i, row: j });
      }
    }
    return out;
  }, [data, k, rows]);

  // Training accuracy (with k+1 since each point is its own neighbour... actually no, real kNN excludes self at training time only for LOOCV)
  // Just measure how many training points match prediction at their own location with k neighbours including self.
  const trainAcc =
    data.reduce((s, p) => s + (knnPredict(data, p.x, p.y, k) === p.c ? 1 : 0), 0) / data.length;

  return (
    <figure className="my-10">
      <div className="overflow-hidden rounded-lg border border-border-subtle bg-surface-raised shadow-md">
        <svg viewBox={`0 0 ${W} ${H}`} className="block h-auto w-full">
          {grid.map((g, i) => (
            <rect
              key={`g-${i}`}
              x={g.col * cellW}
              y={H - (g.row + 1) * cellH}
              width={cellW + 0.5}
              height={cellH + 0.5}
              fill={g.c === 1 ? "rgb(var(--accent-500))" : "rgb(var(--viz-3))"}
              opacity={0.22}
            />
          ))}

          {/* Data points */}
          {data.map((p, i) => (
            <circle
              key={`pt-${i}`}
              cx={sx(p.x)}
              cy={sy(p.y)}
              r={5}
              fill={p.c === 1 ? "rgb(var(--accent-500))" : "rgb(var(--viz-3))"}
              stroke="rgb(var(--surface-raised))"
              strokeWidth={1.5}
            />
          ))}
        </svg>

        <div className="border-t border-border-subtle bg-surface p-4">
          <label className="flex flex-wrap items-center gap-3">
            <span className="text-overline uppercase text-text-muted">
              k (number of neighbours)
            </span>
            <input
              type="range"
              min={1}
              max={MAX_K}
              step={1}
              value={k}
              onChange={(e) => setK(parseInt(e.target.value, 10))}
              className="w-64 accent-accent-500"
            />
            <span className="w-10 font-mono text-h4 text-text-primary">{k}</span>
          </label>

          <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Metric label="Training accuracy" value={trainAcc} />
            <div className="rounded-sm border border-border-subtle bg-canvas p-3">
              <div className="text-overline uppercase text-text-muted">Regime</div>
              <div className="mt-1 text-h4 text-text-primary">
                {k <= 2 ? "High variance" : k <= 10 ? "Balanced" : "High bias"}
              </div>
            </div>
          </div>

          <p className="mt-3 text-body-sm text-text-secondary">
            {k <= 2
              ? "k=1 memorises: every training point shapes its own region. Jagged boundary."
              : k <= 10
                ? "Boundary smooths as k grows. Borderline regions shrink and stable structure emerges."
                : "Large k washes out local structure. The classifier drifts toward predicting the global majority."}
          </p>
        </div>
      </div>
      <figcaption className="mt-3 max-w-prose text-caption text-text-muted">
        Background shading shows the predicted class at each location. With k=1 the boundary traces
        each training point exactly. Increase k and the regions consolidate; at very high k most of
        the plane becomes the majority class.
      </figcaption>
    </figure>
  );
}

function Metric({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-sm border border-border-subtle bg-canvas p-3">
      <div className="text-overline uppercase text-text-muted">{label}</div>
      <div className="mt-1 font-mono text-h4 text-accent-500">{(value * 100).toFixed(1)}%</div>
    </div>
  );
}
