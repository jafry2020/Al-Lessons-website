"use client";

import { useMemo, useState } from "react";

/**
 * Polynomial fit demo for the bias–variance lesson.
 *
 * 25 training and 25 validation points are sampled from y = sin(x) + noise.
 * The widget fits a polynomial of a user-selectable degree (1–10) via the
 * normal equations and plots:
 *   - the true curve (light grey)
 *   - training points (filled circles, accent)
 *   - validation points (open circles, viz-3)
 *   - the fitted polynomial (viz-2)
 *
 * Train and validation MSE update live. The bias-variance U-curve becomes
 * tangible: low degree = high train AND val loss (underfit); high degree =
 * low train loss + high val loss (overfit). Sweet spot lives around 4–6.
 */

const W = 720;
const H = 360;
const X_MIN = -3;
const X_MAX = 3;
const Y_MIN = -1.8;
const Y_MAX = 1.8;
const N_POINTS = 25;
const NOISE_STD = 0.25;

const toScreenX = (x: number) => ((x - X_MIN) / (X_MAX - X_MIN)) * W;
const toScreenY = (y: number) => H - ((y - Y_MIN) / (Y_MAX - Y_MIN)) * H;

// Deterministic pseudo-random (mulberry32) so the demo doesn't shuffle on every
// re-render — students need a stable reference picture.
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

// Box-Muller transform: turns two uniform draws into a normal-ish draw.
function gaussian(rng: () => number): number {
  const u1 = Math.max(rng(), 1e-9);
  const u2 = rng();
  return Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2);
}

function sampleDataset(seed: number): { x: number; y: number }[] {
  const rng = mulberry32(seed);
  const pts: { x: number; y: number }[] = [];
  for (let i = 0; i < N_POINTS; i += 1) {
    const x = X_MIN + (X_MAX - X_MIN) * rng();
    const y = Math.sin(x) + NOISE_STD * gaussian(rng);
    pts.push({ x, y });
  }
  return pts;
}

/**
 * Gauss-Jordan elimination, in-place. Returns the solution vector x
 * for A·x = b, given A (n × n) and b (n).
 */
function solve(A: number[][], b: number[]): number[] {
  const n = b.length;
  // Augment.
  const M: number[][] = A.map((row, i) => [...row, b[i]]);
  for (let col = 0; col < n; col += 1) {
    // Partial pivot for numerical stability at higher degrees.
    let pivotRow = col;
    let pivotVal = Math.abs(M[col][col]);
    for (let r = col + 1; r < n; r += 1) {
      if (Math.abs(M[r][col]) > pivotVal) {
        pivotVal = Math.abs(M[r][col]);
        pivotRow = r;
      }
    }
    if (pivotRow !== col) {
      const tmp = M[col];
      M[col] = M[pivotRow];
      M[pivotRow] = tmp;
    }
    const pivot = M[col][col];
    if (Math.abs(pivot) < 1e-12) return new Array(n).fill(0);
    for (let c = col; c <= n; c += 1) M[col][c] /= pivot;
    for (let r = 0; r < n; r += 1) {
      if (r === col) continue;
      const factor = M[r][col];
      if (factor === 0) continue;
      for (let c = col; c <= n; c += 1) M[r][c] -= factor * M[col][c];
    }
  }
  return M.map((row) => row[n]);
}

/** Fit polynomial of given degree to (x, y) data via normal equations. */
function fitPolynomial(data: { x: number; y: number }[], degree: number): number[] {
  const k = degree + 1; // number of coefficients
  // Center x to [-1, 1] for numerical stability.
  const scale = (X_MAX - X_MIN) / 2;
  const center = (X_MAX + X_MIN) / 2;
  const xs = data.map((d) => (d.x - center) / scale);
  const ys = data.map((d) => d.y);

  // Vandermonde matrix X (n × k).
  const X: number[][] = xs.map((x) => {
    const row = new Array<number>(k);
    let p = 1;
    for (let j = 0; j < k; j += 1) {
      row[j] = p;
      p *= x;
    }
    return row;
  });

  // Normal equations: (X^T X + λI) c = X^T y.
  // Tiny ridge to keep high-degree fits sane.
  const lambda = 1e-7;
  const XtX: number[][] = Array.from({ length: k }, () => new Array(k).fill(0));
  const Xty: number[] = new Array(k).fill(0);
  for (let r = 0; r < xs.length; r += 1) {
    for (let i = 0; i < k; i += 1) {
      Xty[i] += X[r][i] * ys[r];
      for (let j = 0; j < k; j += 1) {
        XtX[i][j] += X[r][i] * X[r][j];
      }
    }
  }
  for (let i = 0; i < k; i += 1) XtX[i][i] += lambda;

  const coeffsScaled = solve(XtX, Xty);
  return coeffsScaled;
}

/** Evaluate fitted polynomial at original (unscaled) x. */
function evalPoly(coeffsScaled: number[], xOriginal: number): number {
  const scale = (X_MAX - X_MIN) / 2;
  const center = (X_MAX + X_MIN) / 2;
  const x = (xOriginal - center) / scale;
  let p = 1;
  let y = 0;
  for (let i = 0; i < coeffsScaled.length; i += 1) {
    y += coeffsScaled[i] * p;
    p *= x;
  }
  return y;
}

function mse(data: { x: number; y: number }[], coeffs: number[]): number {
  let s = 0;
  for (const d of data) {
    const yhat = evalPoly(coeffs, d.x);
    s += (yhat - d.y) ** 2;
  }
  return s / data.length;
}

export function PolynomialFit() {
  const [degree, setDegree] = useState(4);

  const train = useMemo(() => sampleDataset(42), []);
  const val = useMemo(() => sampleDataset(7), []);

  const coeffs = useMemo(() => fitPolynomial(train, degree), [train, degree]);
  const trainMse = useMemo(() => mse(train, coeffs), [train, coeffs]);
  const valMse = useMemo(() => mse(val, coeffs), [val, coeffs]);

  // Sample the fitted polynomial at many points for plotting.
  const fitPath = useMemo(() => {
    const N = 200;
    const pts: string[] = [];
    for (let i = 0; i <= N; i += 1) {
      const x = X_MIN + (i / N) * (X_MAX - X_MIN);
      const y = evalPoly(coeffs, x);
      // Clamp into visible range.
      const yClamped = Math.max(Y_MIN - 2, Math.min(Y_MAX + 2, y));
      pts.push(`${toScreenX(x)},${toScreenY(yClamped)}`);
    }
    return pts.join(" ");
  }, [coeffs]);

  // The true sin curve, for reference.
  const truePath = useMemo(() => {
    const N = 200;
    const pts: string[] = [];
    for (let i = 0; i <= N; i += 1) {
      const x = X_MIN + (i / N) * (X_MAX - X_MIN);
      pts.push(`${toScreenX(x)},${toScreenY(Math.sin(x))}`);
    }
    return pts.join(" ");
  }, []);

  const verdict =
    degree <= 2
      ? "Underfit — the line can't curve enough to match the sine wave."
      : degree <= 6
        ? "Balanced — fits the underlying curve without chasing the noise."
        : "Overfit — the polynomial threads through training noise; validation loss explodes.";

  return (
    <figure className="my-10">
      <div className="overflow-hidden rounded-lg border border-border-subtle bg-surface-raised shadow-md">
        <svg
          viewBox={`0 0 ${W} ${H}`}
          className="block h-auto w-full"
          aria-label="Polynomial fit at degree controlled by slider"
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

          {/* True sine curve */}
          <polyline
            points={truePath}
            fill="none"
            stroke="rgb(var(--text-muted))"
            strokeWidth={1.5}
            strokeDasharray="4 4"
          />

          {/* Fitted polynomial */}
          <polyline
            points={fitPath}
            fill="none"
            stroke="rgb(var(--viz-2))"
            strokeWidth={2.25}
            strokeLinecap="round"
            strokeLinejoin="round"
          />

          {/* Training points (filled) */}
          {train.map((p, i) => (
            <circle
              key={`tr-${i}`}
              cx={toScreenX(p.x)}
              cy={toScreenY(p.y)}
              r={4}
              fill="rgb(var(--accent-500))"
            />
          ))}

          {/* Validation points (open ring) */}
          {val.map((p, i) => (
            <circle
              key={`va-${i}`}
              cx={toScreenX(p.x)}
              cy={toScreenY(p.y)}
              r={4}
              fill="none"
              stroke="rgb(var(--viz-3))"
              strokeWidth={2}
            />
          ))}
        </svg>

        <div className="border-t border-border-subtle bg-surface p-4">
          <div className="flex flex-wrap items-center gap-6">
            <label className="flex items-center gap-3">
              <span className="text-overline uppercase text-text-muted">Polynomial degree</span>
              <input
                type="range"
                min={1}
                max={10}
                step={1}
                value={degree}
                onChange={(e) => setDegree(parseInt(e.target.value, 10))}
                className="w-48 accent-accent-500"
              />
              <span className="w-6 font-mono text-h4 text-text-primary">{degree}</span>
            </label>

            <div className="flex items-center gap-2 text-body-sm">
              <span
                className="inline-block h-2.5 w-2.5 rounded-full"
                style={{ background: "rgb(var(--accent-500))" }}
              />
              <span className="text-text-secondary">Training points</span>
            </div>
            <div className="flex items-center gap-2 text-body-sm">
              <span
                className="inline-block h-2.5 w-2.5 rounded-full border-2"
                style={{ borderColor: "rgb(var(--viz-3))" }}
              />
              <span className="text-text-secondary">Validation points</span>
            </div>
            <div className="flex items-center gap-2 text-body-sm">
              <span
                className="inline-block h-0.5 w-4"
                style={{ background: "rgb(var(--viz-2))" }}
              />
              <span className="text-text-secondary">Fitted polynomial</span>
            </div>
            <div className="flex items-center gap-2 text-body-sm">
              <span
                className="inline-block h-0.5 w-4 border-b border-dashed"
                style={{ borderColor: "rgb(var(--text-muted))" }}
              />
              <span className="text-text-secondary">True curve (sin x)</span>
            </div>
          </div>

          <div className="mt-4 grid grid-cols-2 gap-4 sm:grid-cols-3">
            <Metric label="Training MSE" value={trainMse} tone="accent" />
            <Metric label="Validation MSE" value={valMse} tone="viz3" />
            <Metric label="Gap (val − train)" value={valMse - trainMse} tone="warning" />
          </div>

          <p className="mt-4 text-body-sm text-text-secondary">{verdict}</p>
        </div>
      </div>
      <figcaption className="mt-3 max-w-prose text-caption text-text-muted">
        Slide the degree from 1 to 10. Notice how training MSE drops monotonically while validation
        MSE has a U-shape: the bias–variance trade-off in 25 data points.
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
  tone: "accent" | "viz3" | "warning";
}) {
  const color =
    tone === "accent"
      ? "rgb(var(--accent-500))"
      : tone === "viz3"
        ? "rgb(var(--viz-3))"
        : "rgb(var(--warning))";
  return (
    <div className="rounded-sm border border-border-subtle bg-canvas p-3">
      <div className="text-overline uppercase text-text-muted">{label}</div>
      <div className="mt-1 font-mono text-h4" style={{ color }}>
        {value.toFixed(3)}
      </div>
    </div>
  );
}
