"use client";

import { useMemo, useState } from "react";

/**
 * Build-a-split widget for A2.3.
 *
 * 2D scatter of two classes. The user picks a feature (x1 or x2) and a
 * threshold via a slider; the widget shows the split line, the Gini impurity
 * of each side, and the gain. A "show optimal" button reveals the best split
 * the greedy algorithm would pick.
 */

const W = 600;
const H = 360;
const X_MIN = -3;
const X_MAX = 3;

const sx = (x: number) => ((x - X_MIN) / (X_MAX - X_MIN)) * W;
const sy = (y: number) => H - ((y - X_MIN) / (X_MAX - X_MIN)) * H;

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
  x1: number;
  x2: number;
  y: 0 | 1;
}

function sampleData(): Pt[] {
  const rng = mulberry32(9);
  const pts: Pt[] = [];
  for (let i = 0; i < 30; i += 1) {
    pts.push({ x1: -1.2 + 0.6 * gaussian(rng), x2: 0.6 * gaussian(rng), y: 0 });
  }
  for (let i = 0; i < 30; i += 1) {
    pts.push({ x1: 1.2 + 0.6 * gaussian(rng), x2: 0.4 * gaussian(rng), y: 1 });
  }
  // Add some y2-discriminative data too
  for (let i = 0; i < 10; i += 1) {
    pts.push({ x1: 0.5 * gaussian(rng), x2: 1.6 + 0.4 * gaussian(rng), y: 1 });
  }
  return pts;
}

function gini(pts: Pt[]): number {
  if (pts.length === 0) return 0;
  const p1 = pts.filter((p) => p.y === 1).length / pts.length;
  return 1 - p1 * p1 - (1 - p1) * (1 - p1);
}

function bestSplit(pts: Pt[]): { feature: "x1" | "x2"; threshold: number; gain: number } {
  const parent = gini(pts);
  let best = { feature: "x1" as "x1" | "x2", threshold: 0, gain: -1 };
  for (const feat of ["x1", "x2"] as const) {
    const vals = pts.map((p) => p[feat]).sort((a, b) => a - b);
    for (let i = 0; i < vals.length - 1; i += 1) {
      const t = (vals[i] + vals[i + 1]) / 2;
      const left = pts.filter((p) => p[feat] <= t);
      const right = pts.filter((p) => p[feat] > t);
      if (left.length === 0 || right.length === 0) continue;
      const w = (left.length / pts.length) * gini(left) + (right.length / pts.length) * gini(right);
      const gain = parent - w;
      if (gain > best.gain) best = { feature: feat, threshold: t, gain };
    }
  }
  return best;
}

export function DecisionTreeSplit() {
  const data = useMemo(() => sampleData(), []);
  const [feat, setFeat] = useState<"x1" | "x2">("x1");
  const [t, setT] = useState(0);
  const [showOpt, setShowOpt] = useState(false);

  const opt = useMemo(() => bestSplit(data), [data]);

  const left = data.filter((p) => p[feat] <= t);
  const right = data.filter((p) => p[feat] > t);
  const parentG = gini(data);
  const leftG = gini(left);
  const rightG = gini(right);
  const weighted = (left.length / data.length) * leftG + (right.length / data.length) * rightG;
  const gain = parentG - weighted;

  return (
    <figure className="my-10">
      <div className="overflow-hidden rounded-lg border border-border-subtle bg-surface-raised shadow-md">
        <svg viewBox={`0 0 ${W} ${H}`} className="block h-auto w-full">
          {/* axes */}
          <line x1={0} y1={sy(0)} x2={W} y2={sy(0)} stroke="rgb(var(--border-subtle))" />
          <line x1={sx(0)} y1={0} x2={sx(0)} y2={H} stroke="rgb(var(--border-subtle))" />

          {/* shaded sides */}
          {feat === "x1" ? (
            <>
              <rect x={0} y={0} width={sx(t)} height={H} fill="rgb(var(--viz-3))" opacity={0.08} />
              <rect
                x={sx(t)}
                y={0}
                width={W - sx(t)}
                height={H}
                fill="rgb(var(--accent-500))"
                opacity={0.08}
              />
            </>
          ) : (
            <>
              <rect
                x={0}
                y={sy(t)}
                width={W}
                height={H - sy(t)}
                fill="rgb(var(--viz-3))"
                opacity={0.08}
              />
              <rect
                x={0}
                y={0}
                width={W}
                height={sy(t)}
                fill="rgb(var(--accent-500))"
                opacity={0.08}
              />
            </>
          )}

          {/* user split line */}
          {feat === "x1" ? (
            <line
              x1={sx(t)}
              y1={0}
              x2={sx(t)}
              y2={H}
              stroke="rgb(var(--viz-2))"
              strokeWidth={2.5}
            />
          ) : (
            <line
              x1={0}
              y1={sy(t)}
              x2={W}
              y2={sy(t)}
              stroke="rgb(var(--viz-2))"
              strokeWidth={2.5}
            />
          )}

          {/* optimal split (dashed) */}
          {showOpt &&
            (opt.feature === "x1" ? (
              <line
                x1={sx(opt.threshold)}
                y1={0}
                x2={sx(opt.threshold)}
                y2={H}
                stroke="rgb(var(--warning))"
                strokeWidth={2}
                strokeDasharray="6 5"
              />
            ) : (
              <line
                x1={0}
                y1={sy(opt.threshold)}
                x2={W}
                y2={sy(opt.threshold)}
                stroke="rgb(var(--warning))"
                strokeWidth={2}
                strokeDasharray="6 5"
              />
            ))}

          {data.map((p, i) => (
            <circle
              key={`pt-${i}`}
              cx={sx(p.x1)}
              cy={sy(p.x2)}
              r={4.5}
              fill={p.y === 1 ? "rgb(var(--accent-500))" : "rgb(var(--viz-3))"}
              stroke="rgb(var(--surface-raised))"
              strokeWidth={1.5}
            />
          ))}
        </svg>

        <div className="border-t border-border-subtle bg-surface p-4">
          <div className="flex flex-wrap items-center gap-4">
            <div className="flex items-center gap-2">
              <span className="text-overline uppercase text-text-muted">Split feature</span>
              <button
                onClick={() => setFeat("x1")}
                className={`rounded-sm border px-3 py-1 text-body-sm ${
                  feat === "x1"
                    ? "border-accent-500 bg-accent-500/10 text-accent-500"
                    : "border-border-subtle text-text-secondary"
                }`}
              >
                x₁
              </button>
              <button
                onClick={() => setFeat("x2")}
                className={`rounded-sm border px-3 py-1 text-body-sm ${
                  feat === "x2"
                    ? "border-accent-500 bg-accent-500/10 text-accent-500"
                    : "border-border-subtle text-text-secondary"
                }`}
              >
                x₂
              </button>
            </div>

            <label className="flex flex-1 items-center gap-3">
              <span className="text-overline uppercase text-text-muted">Threshold</span>
              <input
                type="range"
                min={X_MIN}
                max={X_MAX}
                step={0.05}
                value={t}
                onChange={(e) => setT(parseFloat(e.target.value))}
                className="flex-1 accent-accent-500"
              />
              <span className="w-12 font-mono text-body-sm text-text-primary">{t.toFixed(2)}</span>
            </label>

            <button
              onClick={() => setShowOpt(!showOpt)}
              className="rounded-sm border border-warning px-3 py-1 text-body-sm text-warning"
            >
              {showOpt ? "Hide" : "Show"} optimal
            </button>
          </div>

          <div className="mt-4 grid grid-cols-2 gap-4 sm:grid-cols-4">
            <Metric label="Parent Gini" value={parentG} />
            <Metric label="Left Gini" value={leftG} />
            <Metric label="Right Gini" value={rightG} />
            <Metric label="Gain" value={gain} highlight />
          </div>

          {showOpt && (
            <p className="mt-3 text-body-sm text-text-secondary">
              Best greedy split: <strong className="text-warning">{opt.feature}</strong> at{" "}
              <span className="font-mono text-text-primary">{opt.threshold.toFixed(2)}</span> with
              gain <span className="font-mono text-text-primary">{opt.gain.toFixed(3)}</span>.
            </p>
          )}
        </div>
      </div>
      <figcaption className="mt-3 max-w-prose text-caption text-text-muted">
        Pick a feature and threshold; the split divides the points into two halves and the Gini gain
        tells you how much purer the children are. Toggle the optimal split to see what the greedy
        algorithm would have chosen.
      </figcaption>
    </figure>
  );
}

function Metric({
  label,
  value,
  highlight = false,
}: {
  label: string;
  value: number;
  highlight?: boolean;
}) {
  return (
    <div className="rounded-sm border border-border-subtle bg-canvas p-3">
      <div className="text-overline uppercase text-text-muted">{label}</div>
      <div
        className="mt-1 font-mono text-h4"
        style={{ color: highlight ? "rgb(var(--accent-500))" : "rgb(var(--text-primary))" }}
      >
        {value.toFixed(3)}
      </div>
    </div>
  );
}
