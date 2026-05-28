"use client";

import { useMemo, useState } from "react";

/**
 * Isolation Forest demo for A3.7.
 *
 * 2D scatter with a normal cluster plus a few scattered anomalies. The widget
 * builds N random binary trees (axis-aligned random splits) and computes the
 * average path length to isolate each point. Points are shaded by anomaly
 * score; the user controls the number of trees.
 *
 * Below the plot, the path-length distribution histogram shows that anomalies
 * have systematically shorter paths.
 */

const W = 640;
const H = 360;
const X_MIN = -3;
const X_MAX = 3;
const Y_MIN = -2.5;
const Y_MAX = 2.5;
const MAX_DEPTH = 8;
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

interface Pt {
  x: number;
  y: number;
  isAnomaly: boolean;
}

function sampleData(): Pt[] {
  const rng = mulberry32(53);
  const pts: Pt[] = [];
  // Normal cluster
  for (let i = 0; i < 80; i += 1) {
    pts.push({ x: 0.3 * gaussian(rng), y: 0.3 * gaussian(rng), isAnomaly: false });
  }
  // Anomalies, deliberately far from the cluster
  const anomalyPositions = [
    { x: 2.2, y: 1.5 },
    { x: -2.4, y: 1.2 },
    { x: 2.0, y: -1.8 },
    { x: -1.9, y: -1.7 },
    { x: 0.0, y: 2.0 },
    { x: -2.6, y: -0.3 },
  ];
  for (const p of anomalyPositions) {
    pts.push({ ...p, isAnomaly: true });
  }
  return pts;
}

/** Build one random isolation tree and return path length for each point. */
function isolationTreePathLengths(data: Pt[], rng: () => number, maxDepth: number): number[] {
  const lengths = new Array<number>(data.length).fill(0);

  // Recursive helper that operates on indices into data.
  function isolate(indices: number[], depth: number) {
    if (indices.length <= 1 || depth >= maxDepth) {
      for (const i of indices) lengths[i] = depth;
      return;
    }
    // Pick a random feature
    const feat = rng() < 0.5 ? "x" : "y";
    // Compute feature min/max within the current bucket
    let mn = Infinity;
    let mx = -Infinity;
    for (const i of indices) {
      const v = data[i][feat];
      if (v < mn) mn = v;
      if (v > mx) mx = v;
    }
    if (mn === mx) {
      for (const i of indices) lengths[i] = depth;
      return;
    }
    const t = mn + rng() * (mx - mn);
    const left: number[] = [];
    const right: number[] = [];
    for (const i of indices) {
      if (data[i][feat] < t) left.push(i);
      else right.push(i);
    }
    if (left.length === 0 || right.length === 0) {
      for (const i of indices) lengths[i] = depth;
      return;
    }
    isolate(left, depth + 1);
    isolate(right, depth + 1);
  }

  isolate(
    data.map((_, i) => i),
    0
  );
  return lengths;
}

export function IsolationForestDemo() {
  const data = useMemo(() => sampleData(), []);
  const [numTrees, setNumTrees] = useState(20);

  // Precompute MAX_TREES path lengths and use a prefix.
  const allLengths = useMemo(() => {
    const rng = mulberry32(7);
    const trees: number[][] = [];
    for (let t = 0; t < MAX_TREES; t += 1) {
      trees.push(isolationTreePathLengths(data, rng, MAX_DEPTH));
    }
    return trees;
  }, [data]);

  // Average path lengths across active trees.
  const avgLengths = useMemo(() => {
    const avg = new Array<number>(data.length).fill(0);
    for (let i = 0; i < data.length; i += 1) {
      let s = 0;
      for (let t = 0; t < numTrees; t += 1) s += allLengths[t][i];
      avg[i] = s / numTrees;
    }
    return avg;
  }, [allLengths, numTrees, data.length]);

  // Normalize to [0, 1] anomaly score: shorter path = more anomalous.
  const minL = Math.min(...avgLengths);
  const maxL = Math.max(...avgLengths);
  const range = Math.max(1e-6, maxL - minL);
  const scores = avgLengths.map((l) => 1 - (l - minL) / range);

  // For each point, anomaly score informs colour intensity.
  return (
    <figure className="my-10">
      <div className="overflow-hidden rounded-lg border border-border-subtle bg-surface-raised shadow-md">
        <svg viewBox={`0 0 ${W} ${H}`} className="block h-auto w-full">
          <line
            x1={0}
            y1={sy(0)}
            x2={W}
            y2={sy(0)}
            stroke="rgb(var(--border-subtle))"
            strokeWidth={1}
          />
          <line
            x1={sx(0)}
            y1={0}
            x2={sx(0)}
            y2={H}
            stroke="rgb(var(--border-subtle))"
            strokeWidth={1}
          />

          {data.map((p, i) => {
            const score = scores[i];
            // Higher score (more anomalous) -> larger radius and warning colour
            const r = 4 + score * 6;
            return (
              <g key={`pt-${i}`}>
                <circle
                  cx={sx(p.x)}
                  cy={sy(p.y)}
                  r={r}
                  fill={score > 0.5 ? "rgb(var(--warning))" : "rgb(var(--accent-500))"}
                  opacity={0.25 + 0.75 * score}
                  stroke={p.isAnomaly ? "rgb(var(--warning))" : "transparent"}
                  strokeWidth={p.isAnomaly ? 2 : 0}
                />
                {p.isAnomaly && (
                  <circle
                    cx={sx(p.x)}
                    cy={sy(p.y)}
                    r={r + 6}
                    fill="none"
                    stroke="rgb(var(--warning))"
                    strokeWidth={1}
                    strokeDasharray="3 3"
                  />
                )}
              </g>
            );
          })}
        </svg>

        <div className="border-t border-border-subtle bg-surface p-4">
          <label className="flex flex-wrap items-center gap-3">
            <span className="text-overline uppercase text-text-muted">Number of trees (T)</span>
            <input
              type="range"
              min={1}
              max={MAX_TREES}
              step={1}
              value={numTrees}
              onChange={(e) => setNumTrees(parseInt(e.target.value, 10))}
              className="w-64 accent-accent-500"
            />
            <span className="w-10 font-mono text-h4 text-text-primary">{numTrees}</span>
          </label>

          <div className="mt-4">
            <PathHistogram lengths={avgLengths} data={data} />
          </div>

          <p className="mt-3 text-body-sm text-text-secondary">
            {numTrees < 5
              ? "Single trees are noisy — the score for each point depends heavily on which random splits happened to land near it."
              : numTrees < 15
                ? "As trees accumulate, the average path length stabilises; true anomalies separate from normals."
                : "With many trees, the path-length distribution clearly separates anomalies (short paths) from normals (long paths). This is the signal Isolation Forest exploits."}
          </p>
        </div>
      </div>
      <figcaption className="mt-3 max-w-prose text-caption text-text-muted">
        Each circle is a data point; the dashed ring marks ground-truth anomalies. Radius and colour
        intensity encode the Isolation Forest anomaly score (shorter average path length → higher
        score). Note how the 6 true anomalies rise to the top as trees accumulate.
      </figcaption>
    </figure>
  );
}

function PathHistogram({ lengths, data }: { lengths: number[]; data: Pt[] }) {
  const minL = Math.min(...lengths);
  const maxL = Math.max(...lengths);
  const numBins = 16;
  const binWidth = (maxL - minL) / numBins || 1;
  const binsNormal = new Array<number>(numBins).fill(0);
  const binsAnomaly = new Array<number>(numBins).fill(0);
  for (let i = 0; i < lengths.length; i += 1) {
    const idx = Math.min(numBins - 1, Math.floor((lengths[i] - minL) / binWidth));
    if (data[i].isAnomaly) binsAnomaly[idx] += 1;
    else binsNormal[idx] += 1;
  }
  const maxCount = Math.max(...binsNormal, ...binsAnomaly, 1);
  const HISTO_W = 600;
  const HISTO_H = 80;
  const bw = HISTO_W / numBins;

  return (
    <div>
      <div className="text-overline uppercase text-text-muted">Path length distribution</div>
      <svg viewBox={`0 0 ${HISTO_W} ${HISTO_H + 20}`} className="mt-2 block h-auto w-full">
        {binsNormal.map((c, i) => (
          <rect
            key={`n-${i}`}
            x={i * bw + 1}
            y={HISTO_H - (c / maxCount) * HISTO_H}
            width={bw - 2}
            height={(c / maxCount) * HISTO_H}
            fill="rgb(var(--accent-500))"
            opacity={0.6}
          />
        ))}
        {binsAnomaly.map((c, i) => (
          <rect
            key={`a-${i}`}
            x={i * bw + 1}
            y={HISTO_H - (c / maxCount) * HISTO_H}
            width={bw - 2}
            height={(c / maxCount) * HISTO_H}
            fill="rgb(var(--warning))"
          />
        ))}
        <text x={4} y={HISTO_H + 15} fontSize={10} fill="rgb(var(--text-muted))">
          ← short path (anomalous)
        </text>
        <text
          x={HISTO_W - 4}
          y={HISTO_H + 15}
          fontSize={10}
          textAnchor="end"
          fill="rgb(var(--text-muted))"
        >
          long path (normal) →
        </text>
      </svg>
    </div>
  );
}
