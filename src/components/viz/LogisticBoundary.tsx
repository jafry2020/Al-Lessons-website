"use client";

import { useMemo, useState } from "react";

/**
 * Logistic regression widget for A2.2.
 *
 * Left panel: the sigmoid curve with a marker showing where xᵀw + b currently
 * lies for a fixed reference point.
 * Right panel: 40 deterministic 2D points in two classes; the user controls
 * w1, w2, b via sliders and watches the decision boundary {x : w1·x1 + w2·x2 + b = 0}.
 * A background shading shows P(y=1) across the plane.
 */

const PANEL_W = 360;
const PANEL_H = 320;
const X_MIN = -3;
const X_MAX = 3;

const dToScreen = (x: number) => ((x - X_MIN) / (X_MAX - X_MIN)) * PANEL_W;
const dToScreenY = (y: number) => PANEL_H - ((y - X_MIN) / (X_MAX - X_MIN)) * PANEL_H;

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

function sampleData(): { x1: number; x2: number; y: 0 | 1 }[] {
  const rng = mulberry32(21);
  const pts: { x1: number; x2: number; y: 0 | 1 }[] = [];
  for (let i = 0; i < 20; i += 1) {
    pts.push({ x1: -1 + 0.7 * gaussian(rng), x2: -1 + 0.7 * gaussian(rng), y: 0 });
  }
  for (let i = 0; i < 20; i += 1) {
    pts.push({ x1: 1 + 0.7 * gaussian(rng), x2: 1 + 0.7 * gaussian(rng), y: 1 });
  }
  return pts;
}

const sigmoid = (z: number) => 1 / (1 + Math.exp(-z));

function bce(
  data: { x1: number; x2: number; y: 0 | 1 }[],
  w1: number,
  w2: number,
  b: number
): number {
  const eps = 1e-9;
  let s = 0;
  for (const d of data) {
    const p = Math.max(eps, Math.min(1 - eps, sigmoid(w1 * d.x1 + w2 * d.x2 + b)));
    s += -(d.y * Math.log(p) + (1 - d.y) * Math.log(1 - p));
  }
  return s / data.length;
}

function accuracy(
  data: { x1: number; x2: number; y: 0 | 1 }[],
  w1: number,
  w2: number,
  b: number
): number {
  let c = 0;
  for (const d of data) {
    const p = sigmoid(w1 * d.x1 + w2 * d.x2 + b);
    const pred = p >= 0.5 ? 1 : 0;
    if (pred === d.y) c += 1;
  }
  return c / data.length;
}

export function LogisticBoundary() {
  const data = useMemo(() => sampleData(), []);
  const [w1, setW1] = useState(1);
  const [w2, setW2] = useState(1);
  const [b, setB] = useState(-0.3);

  const loss = useMemo(() => bce(data, w1, w2, b), [data, w1, w2, b]);
  const acc = useMemo(() => accuracy(data, w1, w2, b), [data, w1, w2, b]);

  // Sigmoid curve points (z range -8..8).
  const sigPath = useMemo(() => {
    const N = 200;
    const pts: string[] = [];
    const W = 360;
    const H = 220;
    for (let i = 0; i <= N; i += 1) {
      const z = -8 + (i / N) * 16;
      const p = sigmoid(z);
      const sx = (i / N) * W;
      const sy = H - p * H;
      pts.push(`${sx},${sy}`);
    }
    return pts.join(" ");
  }, []);

  // Background heatmap: sample on a coarse grid.
  const GRID = 22;
  const cellW = PANEL_W / GRID;
  const cellH = PANEL_H / GRID;

  // Decision boundary as line clipped to panel.
  // w1·x1 + w2·x2 + b = 0  =>  x2 = -(w1·x1 + b) / w2
  const boundaryLine = useMemo(() => {
    if (Math.abs(w2) < 1e-3) {
      // Vertical line: x1 = -b/w1
      const xv = -b / w1;
      if (xv < X_MIN || xv > X_MAX) return null;
      return { x1a: xv, x2a: X_MIN, x1b: xv, x2b: X_MAX };
    }
    const x2a = -(w1 * X_MIN + b) / w2;
    const x2b = -(w1 * X_MAX + b) / w2;
    return { x1a: X_MIN, x2a, x1b: X_MAX, x2b };
  }, [w1, w2, b]);

  // Reference probe point for the sigmoid panel: a fixed test x.
  const probeX1 = 0.5;
  const probeX2 = 0.5;
  const probeZ = w1 * probeX1 + w2 * probeX2 + b;
  const probeP = sigmoid(probeZ);

  return (
    <figure className="my-10">
      <div className="overflow-hidden rounded-lg border border-border-subtle bg-surface-raised shadow-md">
        <div className="grid gap-4 p-4 md:grid-cols-2">
          {/* LEFT: Sigmoid panel */}
          <div>
            <div className="mb-2 text-overline uppercase text-text-muted">
              Sigmoid: probability vs. linear output z
            </div>
            <svg viewBox="0 0 360 220" className="block h-auto w-full">
              {/* baseline */}
              <line x1={0} y1={220} x2={360} y2={220} stroke="rgb(var(--border-subtle))" />
              <line x1={180} y1={0} x2={180} y2={220} stroke="rgb(var(--border-subtle))" />
              <line
                x1={0}
                y1={110}
                x2={360}
                y2={110}
                stroke="rgb(var(--border-subtle))"
                strokeDasharray="3 4"
              />
              {/* curve */}
              <polyline points={sigPath} fill="none" stroke="rgb(var(--viz-2))" strokeWidth={2.5} />
              {/* probe marker */}
              <line
                x1={((probeZ + 8) / 16) * 360}
                y1={0}
                x2={((probeZ + 8) / 16) * 360}
                y2={220}
                stroke="rgb(var(--accent-500))"
                strokeWidth={1.5}
                strokeDasharray="4 4"
              />
              <circle
                cx={((Math.max(-8, Math.min(8, probeZ)) + 8) / 16) * 360}
                cy={220 - probeP * 220}
                r={6}
                fill="rgb(var(--accent-500))"
              />
              <text x={6} y={14} fontSize={11} fill="rgb(var(--text-muted))">
                p = 1
              </text>
              <text x={6} y={216} fontSize={11} fill="rgb(var(--text-muted))">
                p = 0
              </text>
              <text x={184} y={216} fontSize={11} fill="rgb(var(--text-muted))">
                z = 0
              </text>
            </svg>
            <div className="mt-2 text-body-sm text-text-secondary">
              For the probe point x = (0.5, 0.5): z ={" "}
              <span className="font-mono text-text-primary">{probeZ.toFixed(2)}</span>, σ(z) ={" "}
              <span className="font-mono text-text-primary">{probeP.toFixed(3)}</span>
            </div>
          </div>

          {/* RIGHT: 2D decision boundary */}
          <div>
            <div className="mb-2 text-overline uppercase text-text-muted">
              Decision boundary in feature space
            </div>
            <svg viewBox={`0 0 ${PANEL_W} ${PANEL_H}`} className="block h-auto w-full">
              {/* heatmap */}
              {Array.from({ length: GRID }).flatMap((_, i) =>
                Array.from({ length: GRID }).map((_, j) => {
                  const x1 = X_MIN + ((i + 0.5) / GRID) * (X_MAX - X_MIN);
                  const x2 = X_MIN + ((j + 0.5) / GRID) * (X_MAX - X_MIN);
                  const p = sigmoid(w1 * x1 + w2 * x2 + b);
                  const c = p; // 0..1
                  const r = Math.round(180 - 80 * c);
                  const g = Math.round(160 + 30 * (1 - Math.abs(c - 0.5) * 2));
                  const bl = Math.round(120 + 80 * (1 - c));
                  return (
                    <rect
                      key={`h-${i}-${j}`}
                      x={i * cellW}
                      y={PANEL_H - (j + 1) * cellH}
                      width={cellW + 0.5}
                      height={cellH + 0.5}
                      fill={`rgb(${r}, ${g}, ${bl})`}
                      opacity={0.35}
                    />
                  );
                })
              )}

              {/* boundary line */}
              {boundaryLine && (
                <line
                  x1={dToScreen(boundaryLine.x1a)}
                  y1={dToScreenY(boundaryLine.x2a)}
                  x2={dToScreen(boundaryLine.x1b)}
                  y2={dToScreenY(boundaryLine.x2b)}
                  stroke="rgb(var(--viz-2))"
                  strokeWidth={2.5}
                />
              )}

              {/* points */}
              {data.map((p, i) => (
                <circle
                  key={`pt-${i}`}
                  cx={dToScreen(p.x1)}
                  cy={dToScreenY(p.x2)}
                  r={4.5}
                  fill={p.y === 1 ? "rgb(var(--accent-500))" : "rgb(var(--viz-3))"}
                  stroke="rgb(var(--surface-raised))"
                  strokeWidth={1.5}
                />
              ))}
            </svg>
            <div className="mt-2 text-body-sm text-text-secondary">
              Class 1: <span style={{ color: "rgb(var(--accent-500))" }}>●</span> Class 0:{" "}
              <span style={{ color: "rgb(var(--viz-3))" }}>●</span> Background shading is P(y=1).
            </div>
          </div>
        </div>

        <div className="border-t border-border-subtle bg-surface p-4">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <Slider label="w₁" value={w1} setValue={setW1} min={-3} max={3} />
            <Slider label="w₂" value={w2} setValue={setW2} min={-3} max={3} />
            <Slider label="b (bias)" value={b} setValue={setB} min={-3} max={3} />
          </div>
          <div className="mt-4 grid grid-cols-2 gap-4 sm:grid-cols-2">
            <Metric label="Cross-entropy" value={loss} digits={3} />
            <Metric label="Accuracy" value={acc} digits={3} />
          </div>
        </div>
      </div>
      <figcaption className="mt-3 max-w-prose text-caption text-text-muted">
        Sliders control the weights and bias. The boundary {`{x : w₁x₁ + w₂x₂ + b = 0}`} separates
        the two classes; background shading shows the predicted probability. The sigmoid panel
        tracks one fixed probe point as the parameters change.
      </figcaption>
    </figure>
  );
}

function Slider({
  label,
  value,
  setValue,
  min,
  max,
}: {
  label: string;
  value: number;
  setValue: (n: number) => void;
  min: number;
  max: number;
}) {
  return (
    <label className="flex items-center gap-3">
      <span className="w-12 text-overline uppercase text-text-muted">{label}</span>
      <input
        type="range"
        min={min}
        max={max}
        step={0.05}
        value={value}
        onChange={(e) => setValue(parseFloat(e.target.value))}
        className="flex-1 accent-accent-500"
      />
      <span className="w-12 font-mono text-body-sm text-text-primary">{value.toFixed(2)}</span>
    </label>
  );
}

function Metric({ label, value, digits = 3 }: { label: string; value: number; digits?: number }) {
  return (
    <div className="rounded-sm border border-border-subtle bg-canvas p-3">
      <div className="text-overline uppercase text-text-muted">{label}</div>
      <div className="mt-1 font-mono text-h4 text-accent-500">{value.toFixed(digits)}</div>
    </div>
  );
}
