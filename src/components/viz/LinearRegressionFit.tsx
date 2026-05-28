"use client";

import { useMemo, useState } from "react";

/**
 * Drag-the-line widget for A2.1 linear regression.
 *
 * 20 deterministic points sampled from y = 0.7x + 0.4 + noise. The user drags
 * two handles to control the line's slope and intercept; live MSE is shown
 * alongside the optimal MSE (closed-form OLS solution). A faint reference
 * line shows the optimum.
 */

const W = 720;
const H = 360;
const X_MIN = -3;
const X_MAX = 3;
const Y_MIN = -3;
const Y_MAX = 3;
const N = 20;
const NOISE = 0.45;
const TRUE_SLOPE = 0.7;
const TRUE_INTERCEPT = 0.4;

const toScreenX = (x: number) => ((x - X_MIN) / (X_MAX - X_MIN)) * W;
const toScreenY = (y: number) => H - ((y - Y_MIN) / (Y_MAX - Y_MIN)) * H;
const toDataY = (py: number) => Y_MIN + ((H - py) / H) * (Y_MAX - Y_MIN);

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
  const rng = mulberry32(13);
  const pts: { x: number; y: number }[] = [];
  for (let i = 0; i < N; i += 1) {
    const x = X_MIN + 0.4 + (X_MAX - X_MIN - 0.8) * rng();
    const y = TRUE_SLOPE * x + TRUE_INTERCEPT + NOISE * gaussian(rng);
    pts.push({ x, y });
  }
  return pts;
}

/** Closed-form OLS for slope (m) and intercept (b). */
function olsFit(data: { x: number; y: number }[]): { m: number; b: number } {
  const n = data.length;
  let sx = 0;
  let sy = 0;
  let sxx = 0;
  let sxy = 0;
  for (const d of data) {
    sx += d.x;
    sy += d.y;
    sxx += d.x * d.x;
    sxy += d.x * d.y;
  }
  const m = (n * sxy - sx * sy) / (n * sxx - sx * sx);
  const b = (sy - m * sx) / n;
  return { m, b };
}

function mse(data: { x: number; y: number }[], m: number, b: number): number {
  let s = 0;
  for (const d of data) {
    const yhat = m * d.x + b;
    s += (yhat - d.y) ** 2;
  }
  return s / data.length;
}

export function LinearRegressionFit() {
  const data = useMemo(() => sampleData(), []);
  const opt = useMemo(() => olsFit(data), [data]);
  const optMse = useMemo(() => mse(data, opt.m, opt.b), [data, opt]);

  // User-controlled line: two handles at x = -2 and x = 2.
  const [yLeft, setYLeft] = useState(-1.5);
  const [yRight, setYRight] = useState(1.5);
  const [dragging, setDragging] = useState<"left" | "right" | null>(null);

  const userM = (yRight - yLeft) / 4; // (yR - yL) / (xR - xL), xR - xL = 4
  const userB = yLeft + 2 * userM; // y at x = 0
  const userMse = useMemo(() => mse(data, userM, userB), [data, userM, userB]);

  const handlePointerDown = (which: "left" | "right") => () => setDragging(which);

  const handlePointerMove = (e: React.PointerEvent<SVGSVGElement>) => {
    if (!dragging) return;
    const svg = e.currentTarget;
    const pt = svg.getBoundingClientRect();
    const py = ((e.clientY - pt.top) / pt.height) * H;
    const y = Math.max(Y_MIN + 0.2, Math.min(Y_MAX - 0.2, toDataY(py)));
    if (dragging === "left") setYLeft(y);
    else setYRight(y);
  };

  const handlePointerUp = () => setDragging(null);

  const xLeft = -2;
  const xRight = 2;
  const optYLeft = opt.m * xLeft + opt.b;
  const optYRight = opt.m * xRight + opt.b;

  const gap = userMse - optMse;
  const verdict =
    gap < 0.05
      ? "Within 5% of optimal — well-fit."
      : gap < 0.3
        ? "Close, but the line can move to reduce MSE."
        : "Far from optimal — try matching the faint reference line.";

  return (
    <figure className="my-10">
      <div className="overflow-hidden rounded-lg border border-border-subtle bg-surface-raised shadow-md">
        <svg
          viewBox={`0 0 ${W} ${H}`}
          className="block h-auto w-full touch-none select-none"
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          onPointerLeave={handlePointerUp}
          aria-label="Drag the line endpoints to fit the points; MSE updates live"
        >
          {/* Axes */}
          <line
            x1={0}
            y1={toScreenY(0)}
            x2={W}
            y2={toScreenY(0)}
            stroke="rgb(var(--border-subtle))"
            strokeWidth={1}
          />
          <line
            x1={toScreenX(0)}
            y1={0}
            x2={toScreenX(0)}
            y2={H}
            stroke="rgb(var(--border-subtle))"
            strokeWidth={1}
          />

          {/* Optimal reference (faint) */}
          <line
            x1={toScreenX(xLeft)}
            y1={toScreenY(optYLeft)}
            x2={toScreenX(xRight)}
            y2={toScreenY(optYRight)}
            stroke="rgb(var(--text-muted))"
            strokeWidth={1.5}
            strokeDasharray="6 5"
          />

          {/* Residual lines (vertical from each point to user line) */}
          {data.map((p, i) => {
            const yhat = userM * p.x + userB;
            return (
              <line
                key={`res-${i}`}
                x1={toScreenX(p.x)}
                y1={toScreenY(p.y)}
                x2={toScreenX(p.x)}
                y2={toScreenY(yhat)}
                stroke="rgb(var(--warning))"
                strokeOpacity={0.35}
                strokeWidth={1}
              />
            );
          })}

          {/* User line */}
          <line
            x1={toScreenX(xLeft)}
            y1={toScreenY(yLeft)}
            x2={toScreenX(xRight)}
            y2={toScreenY(yRight)}
            stroke="rgb(var(--viz-2))"
            strokeWidth={2.5}
            strokeLinecap="round"
          />

          {/* Data points */}
          {data.map((p, i) => (
            <circle
              key={`pt-${i}`}
              cx={toScreenX(p.x)}
              cy={toScreenY(p.y)}
              r={4}
              fill="rgb(var(--accent-500))"
            />
          ))}

          {/* Draggable handles */}
          <circle
            cx={toScreenX(xLeft)}
            cy={toScreenY(yLeft)}
            r={10}
            fill="rgb(var(--viz-2))"
            stroke="rgb(var(--surface-raised))"
            strokeWidth={3}
            style={{ cursor: "ns-resize" }}
            onPointerDown={handlePointerDown("left")}
          />
          <circle
            cx={toScreenX(xRight)}
            cy={toScreenY(yRight)}
            r={10}
            fill="rgb(var(--viz-2))"
            stroke="rgb(var(--surface-raised))"
            strokeWidth={3}
            style={{ cursor: "ns-resize" }}
            onPointerDown={handlePointerDown("right")}
          />
        </svg>

        <div className="border-t border-border-subtle bg-surface p-4">
          <div className="flex flex-wrap items-center gap-4 text-body-sm">
            <div className="flex items-center gap-2">
              <span
                className="inline-block h-0.5 w-4"
                style={{ background: "rgb(var(--viz-2))" }}
              />
              <span className="text-text-secondary">Your line</span>
            </div>
            <div className="flex items-center gap-2">
              <span
                className="inline-block h-0.5 w-4 border-b border-dashed"
                style={{ borderColor: "rgb(var(--text-muted))" }}
              />
              <span className="text-text-secondary">Optimal (OLS)</span>
            </div>
            <div className="flex items-center gap-2">
              <span
                className="inline-block h-2.5 w-2.5 rounded-full"
                style={{ background: "rgb(var(--accent-500))" }}
              />
              <span className="text-text-secondary">Data</span>
            </div>
            <div className="flex items-center gap-2">
              <span
                className="inline-block h-0.5 w-4"
                style={{ background: "rgb(var(--warning))", opacity: 0.6 }}
              />
              <span className="text-text-secondary">Residuals</span>
            </div>
          </div>

          <div className="mt-4 grid grid-cols-2 gap-4 sm:grid-cols-4">
            <Metric label="Your MSE" value={userMse} tone="viz2" />
            <Metric label="Optimal MSE" value={optMse} tone="muted" />
            <Metric label="Slope" value={userM} tone="accent" digits={2} />
            <Metric label="Intercept" value={userB} tone="accent" digits={2} />
          </div>

          <p className="mt-4 text-body-sm text-text-secondary">{verdict}</p>
        </div>
      </div>
      <figcaption className="mt-3 max-w-prose text-caption text-text-muted">
        Drag either endpoint to rotate or shift the line. The faint dashed line is the closed-form
        OLS optimum; your goal is to match its MSE. Residuals (vertical orange) are what squared
        error is summing.
      </figcaption>
    </figure>
  );
}

function Metric({
  label,
  value,
  tone,
  digits = 3,
}: {
  label: string;
  value: number;
  tone: "viz2" | "muted" | "accent";
  digits?: number;
}) {
  const color =
    tone === "viz2"
      ? "rgb(var(--viz-2))"
      : tone === "muted"
        ? "rgb(var(--text-muted))"
        : "rgb(var(--accent-500))";
  return (
    <div className="rounded-sm border border-border-subtle bg-canvas p-3">
      <div className="text-overline uppercase text-text-muted">{label}</div>
      <div className="mt-1 font-mono text-h4" style={{ color }}>
        {value.toFixed(digits)}
      </div>
    </div>
  );
}
