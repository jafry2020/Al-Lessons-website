"use client";

import { useMemo, useState } from "react";

/**
 * k-means iteration viewer for A3.2.
 *
 * 90 deterministic 2D points in 3 Gaussian blobs. The user clicks "Step" to
 * run one Lloyd iteration (assign + update). "Reset" re-initialises centroids
 * to a new random spread (k-means++ style). Inertia is shown live; assigned
 * points are coloured by cluster.
 */

const W = 640;
const H = 360;
const X_MIN = -3;
const X_MAX = 3;
const Y_MIN = -2;
const Y_MAX = 2;
const K = 3;
const CLUSTER_COLORS = ["var(--accent-500)", "var(--viz-2)", "var(--viz-3)"];

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
}

function sampleData(): Pt[] {
  const rng = mulberry32(99);
  const pts: Pt[] = [];
  const centers = [
    { x: -1.8, y: 0.8 },
    { x: 1.6, y: 0.6 },
    { x: 0.1, y: -1.1 },
  ];
  for (const c of centers) {
    for (let i = 0; i < 30; i += 1) {
      pts.push({ x: c.x + 0.45 * gaussian(rng), y: c.y + 0.35 * gaussian(rng) });
    }
  }
  return pts;
}

function distSq(a: Pt, b: Pt): number {
  return (a.x - b.x) ** 2 + (a.y - b.y) ** 2;
}

/** k-means++ init: pick first centroid at random, subsequent ones probabilistically. */
function initCentroids(data: Pt[], k: number, seed: number): Pt[] {
  const rng = mulberry32(seed);
  const idx = Math.floor(rng() * data.length);
  const centroids: Pt[] = [data[idx]];
  while (centroids.length < k) {
    const dists = data.map((p) => Math.min(...centroids.map((c) => distSq(p, c))));
    const total = dists.reduce((a, b) => a + b, 0);
    let r = rng() * total;
    let chosen = 0;
    for (let i = 0; i < dists.length; i += 1) {
      r -= dists[i];
      if (r <= 0) {
        chosen = i;
        break;
      }
    }
    centroids.push(data[chosen]);
  }
  return centroids;
}

function assign(data: Pt[], centroids: Pt[]): number[] {
  return data.map((p) => {
    let best = 0;
    let bestD = Infinity;
    for (let k = 0; k < centroids.length; k += 1) {
      const d = distSq(p, centroids[k]);
      if (d < bestD) {
        bestD = d;
        best = k;
      }
    }
    return best;
  });
}

function update(data: Pt[], assignments: number[], k: number): Pt[] {
  const sums = Array.from({ length: k }, () => ({ x: 0, y: 0, n: 0 }));
  for (let i = 0; i < data.length; i += 1) {
    const a = assignments[i];
    sums[a].x += data[i].x;
    sums[a].y += data[i].y;
    sums[a].n += 1;
  }
  return sums.map((s) => (s.n > 0 ? { x: s.x / s.n, y: s.y / s.n } : { x: 0, y: 0 }));
}

function inertia(data: Pt[], centroids: Pt[], assignments: number[]): number {
  let s = 0;
  for (let i = 0; i < data.length; i += 1) {
    s += distSq(data[i], centroids[assignments[i]]);
  }
  return s;
}

export function KMeansIterations() {
  const data = useMemo(() => sampleData(), []);
  const [seed, setSeed] = useState(1);
  const [iter, setIter] = useState(0);
  const [phase, setPhase] = useState<"assign" | "update">("assign");

  // Compute full state up to current iter and phase.
  const { centroids, assignments, isConverged } = useMemo(() => {
    let cs = initCentroids(data, K, seed);
    let asg = assign(data, cs);
    let prevAsg = asg;
    let converged = false;
    for (let it = 0; it < iter; it += 1) {
      cs = update(data, asg, K);
      const newAsg = assign(data, cs);
      if (newAsg.every((v, i) => v === prevAsg[i]) && it > 0) converged = true;
      prevAsg = asg;
      asg = newAsg;
    }
    // If still in "assign" phase of current iter, show the assignment to current centroids.
    // If "update" phase, show new centroids that would result from updating.
    let displayCentroids = cs;
    const displayAssignments = asg;
    if (phase === "update") {
      displayCentroids = update(data, asg, K);
    }
    return { centroids: displayCentroids, assignments: displayAssignments, isConverged: converged };
  }, [data, seed, iter, phase]);

  const currentInertia = inertia(data, centroids, assignments);

  const step = () => {
    if (phase === "assign") {
      setPhase("update");
    } else {
      setPhase("assign");
      setIter(iter + 1);
    }
  };
  const reset = () => {
    setSeed(seed + 1);
    setIter(0);
    setPhase("assign");
  };

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

          {/* Lines from each point to its centroid */}
          {data.map((p, i) => {
            const c = centroids[assignments[i]];
            return (
              <line
                key={`l-${i}`}
                x1={sx(p.x)}
                y1={sy(p.y)}
                x2={sx(c.x)}
                y2={sy(c.y)}
                stroke={`rgb(${CLUSTER_COLORS[assignments[i]]})`}
                strokeOpacity={0.18}
                strokeWidth={1}
              />
            );
          })}

          {/* Points */}
          {data.map((p, i) => (
            <circle
              key={`pt-${i}`}
              cx={sx(p.x)}
              cy={sy(p.y)}
              r={4}
              fill={`rgb(${CLUSTER_COLORS[assignments[i]]})`}
              opacity={0.85}
            />
          ))}

          {/* Centroids */}
          {centroids.map((c, k) => (
            <g key={`c-${k}`}>
              <circle
                cx={sx(c.x)}
                cy={sy(c.y)}
                r={11}
                fill={`rgb(${CLUSTER_COLORS[k]})`}
                stroke="rgb(var(--surface-raised))"
                strokeWidth={3}
              />
              <text
                x={sx(c.x)}
                y={sy(c.y) + 4}
                textAnchor="middle"
                fontSize={11}
                fontWeight={700}
                fill="rgb(var(--surface-raised))"
              >
                {k + 1}
              </text>
            </g>
          ))}
        </svg>

        <div className="border-t border-border-subtle bg-surface p-4">
          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={step}
              disabled={isConverged}
              className="rounded-sm border border-accent-500 bg-accent-500/10 px-4 py-1.5 text-body-sm text-accent-500 disabled:opacity-50"
            >
              {phase === "assign" ? "Step: assign points" : "Step: move centroids"}
            </button>
            <button
              onClick={reset}
              className="rounded-sm border border-border-subtle px-4 py-1.5 text-body-sm text-text-secondary"
            >
              Reset (new init)
            </button>
            <div className="ml-auto flex items-center gap-4 text-body-sm">
              <div>
                <span className="text-overline uppercase text-text-muted">Iteration</span>{" "}
                <span className="font-mono text-text-primary">{iter}</span>
              </div>
              <div>
                <span className="text-overline uppercase text-text-muted">Inertia</span>{" "}
                <span className="font-mono text-accent-500">{currentInertia.toFixed(2)}</span>
              </div>
              <div>
                <span className="text-overline uppercase text-text-muted">Status</span>{" "}
                <span className="font-mono text-text-primary">
                  {isConverged
                    ? "Converged"
                    : phase === "assign"
                      ? "Ready to assign"
                      : "Ready to update"}
                </span>
              </div>
            </div>
          </div>
          <p className="mt-3 text-body-sm text-text-secondary">
            {iter === 0
              ? "Iteration 0: centroids are placed by k-means++. Click 'Step' to assign each point to its nearest centroid."
              : isConverged
                ? "Converged: assignments haven't changed for a full step. Inertia won't decrease further."
                : phase === "assign"
                  ? "Centroids just moved; ready to reassign points to nearest centroid."
                  : "Points just got assigned; centroids will move to the mean of their cluster."}
          </p>
        </div>
      </div>
      <figcaption className="mt-3 max-w-prose text-caption text-text-muted">
        Each step is one half-iteration of Lloyd's algorithm. Inertia is the sum of squared
        distances from each point to its centroid — it goes down or stays the same at every step,
        which is how the algorithm is guaranteed to converge.
      </figcaption>
    </figure>
  );
}
