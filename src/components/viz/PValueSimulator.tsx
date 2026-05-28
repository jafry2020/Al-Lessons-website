"use client";

import { useMemo, useState } from "react";

/**
 * p-value simulator for the hypothesis-testing lesson.
 *
 * Runs N_SIMS two-sample z-tests where the true effect size is zero (both
 * groups are drawn from N(0,1)). Plots a histogram of the resulting p-values.
 * Under the null, p-values are uniform on [0,1] — so roughly alpha * N_SIMS
 * tests will show "significance" by chance alone. Students can see the false
 * positive rate materially match the chosen α threshold.
 *
 * Simulation is deterministic per seed; clicking "New simulation" increments
 * the seed so students see variability without every re-render reshuffling.
 */

const N_SIMS = 500;
const N_BINS = 20;
const W = 680;
const H = 260;
const L = 44; // left margin (for y labels)
const R = 12;
const T = 16;
const B = 40; // bottom margin (for x labels)
const PLOT_W = W - L - R;
const PLOT_H = H - T - B;

// ---------------------------------------------------------------------------
// Math helpers — deterministic PRNG + normal CDF approximation
// ---------------------------------------------------------------------------

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

function sampleNormal(rng: () => number): number {
  const u1 = Math.max(rng(), 1e-9);
  const u2 = rng();
  return Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2);
}

// Abramowitz & Stegun approximation for erf — accurate to ~1.5×10⁻⁷.
function erf(x: number): number {
  const sign = x >= 0 ? 1 : -1;
  const ax = Math.abs(x);
  const t = 1 / (1 + 0.3275911 * ax);
  const poly =
    t *
    (0.254829592 + t * (-0.284496736 + t * (1.421413741 + t * (-1.453152027 + t * 1.061405429))));
  return sign * (1 - poly * Math.exp(-ax * ax));
}

function normCDF(z: number): number {
  return 0.5 * (1 + erf(z / Math.SQRT2));
}

/** Two-sample z-test assuming both groups are N(0, 1). Returns the p-value. */
function twoSamplePValue(rng: () => number, n: number): number {
  let sumA = 0,
    sumB = 0;
  for (let i = 0; i < n; i++) {
    sumA += sampleNormal(rng);
    sumB += sampleNormal(rng);
  }
  const z = (sumA / n - sumB / n) / Math.sqrt(2 / n);
  return 2 * (1 - normCDF(Math.abs(z)));
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function PValueSimulator() {
  const [seed, setSeed] = useState(42);
  const [sampleSize, setSampleSize] = useState(50);
  const [alpha, setAlpha] = useState(0.05);

  // Run N_SIMS tests and bucket into a histogram.
  const bins = useMemo<number[]>(() => {
    const rng = mulberry32(seed * 31337 + sampleSize);
    const counts = new Array<number>(N_BINS).fill(0);
    for (let i = 0; i < N_SIMS; i++) {
      const p = twoSamplePValue(rng, sampleSize);
      const bin = Math.min(Math.floor(p * N_BINS), N_BINS - 1);
      counts[bin]++;
    }
    return counts;
  }, [seed, sampleSize]);

  const maxCount = Math.max(...bins, 1);
  const expectedPerBin = N_SIMS / N_BINS; // should be 25 if uniform

  // How many bins are "below α" in the histogram.
  const alphaBins = Math.max(1, Math.round(alpha * N_BINS)); // e.g. α=0.05 → 1 bin
  const falsePositives = bins.slice(0, alphaBins).reduce((s, c) => s + c, 0);
  const fpRate = (falsePositives / N_SIMS) * 100;

  // SVG helpers.
  const binW = PLOT_W / N_BINS;
  const toBarH = (count: number) => (count / maxCount) * PLOT_H;
  const expectedLineY = T + PLOT_H - (expectedPerBin / maxCount) * PLOT_H;
  const alphaLineX = L + (alpha / 1) * PLOT_W;

  return (
    <figure className="my-10">
      <div className="overflow-hidden rounded-lg border border-border-subtle bg-surface-raised shadow-md">
        <svg
          viewBox={`0 0 ${W} ${H}`}
          className="block h-auto w-full"
          aria-label="Histogram of p-values from 500 simulations under the null hypothesis"
        >
          {/* Axes */}
          <line
            x1={L}
            y1={T}
            x2={L}
            y2={T + PLOT_H}
            stroke="rgb(var(--border-subtle))"
            strokeWidth={1}
          />
          <line
            x1={L}
            y1={T + PLOT_H}
            x2={L + PLOT_W}
            y2={T + PLOT_H}
            stroke="rgb(var(--border-subtle))"
            strokeWidth={1}
          />

          {/* Bars */}
          {bins.map((count, i) => {
            const bx = L + i * binW;
            const bh = toBarH(count);
            const isSignificant = i < alphaBins;
            return (
              <rect
                key={i}
                x={bx + 1}
                y={T + PLOT_H - bh}
                width={binW - 2}
                height={bh}
                fill={isSignificant ? "rgb(var(--danger) / 0.75)" : "rgb(var(--accent-500) / 0.5)"}
                rx={1.5}
              />
            );
          })}

          {/* Expected (uniform) reference line */}
          <line
            x1={L}
            y1={expectedLineY}
            x2={L + PLOT_W}
            y2={expectedLineY}
            stroke="rgb(var(--text-muted))"
            strokeWidth={1.5}
            strokeDasharray="5 4"
          />
          <text
            x={L + PLOT_W - 4}
            y={expectedLineY - 5}
            textAnchor="end"
            fontSize={11}
            fill="rgb(var(--text-muted))"
          >
            expected (uniform)
          </text>

          {/* Alpha threshold line */}
          <line
            x1={alphaLineX}
            y1={T}
            x2={alphaLineX}
            y2={T + PLOT_H}
            stroke="rgb(var(--danger))"
            strokeWidth={1.5}
            strokeDasharray="4 3"
          />

          {/* X axis labels: 0, 0.25, 0.5, 0.75, 1 */}
          {[0, 0.25, 0.5, 0.75, 1].map((v) => (
            <text
              key={v}
              x={L + v * PLOT_W}
              y={T + PLOT_H + 16}
              textAnchor="middle"
              fontSize={11}
              fill="rgb(var(--text-muted))"
            >
              {v.toFixed(2)}
            </text>
          ))}
          <text
            x={L + PLOT_W / 2}
            y={T + PLOT_H + 32}
            textAnchor="middle"
            fontSize={11}
            fill="rgb(var(--text-muted))"
          >
            p-value
          </text>

          {/* Y axis: a few reference counts */}
          {[0, 0.5, 1].map((t) => {
            const count = Math.round(t * maxCount);
            const sy = T + PLOT_H - t * PLOT_H;
            return (
              <g key={t}>
                <line
                  x1={L - 4}
                  y1={sy}
                  x2={L}
                  y2={sy}
                  stroke="rgb(var(--border-subtle))"
                  strokeWidth={1}
                />
                <text
                  x={L - 7}
                  y={sy + 4}
                  textAnchor="end"
                  fontSize={10}
                  fill="rgb(var(--text-muted))"
                >
                  {count}
                </text>
              </g>
            );
          })}
        </svg>

        {/* Controls */}
        <div className="space-y-3 border-t border-border-subtle bg-surface p-4">
          <div className="flex flex-wrap gap-6">
            <SliderRow
              label={`Sample size (n = ${sampleSize})`}
              value={sampleSize}
              min={10}
              max={300}
              step={10}
              onChange={setSampleSize}
            />
            <SliderRow
              label={`Significance level α = ${alpha.toFixed(2)}`}
              value={alpha}
              min={0.01}
              max={0.15}
              step={0.01}
              onChange={setAlpha}
            />
          </div>

          <button
            onClick={() => setSeed((s) => s + 1)}
            className="rounded-md border border-border-subtle bg-subtle px-4 py-1.5 text-body-sm font-medium text-text-secondary transition-colors hover:bg-surface-raised hover:text-text-primary"
          >
            New simulation
          </button>

          {/* Readout */}
          <div className="grid grid-cols-3 gap-3 pt-1">
            <MetricChip
              label="False positives"
              value={falsePositives}
              unit={`/ ${N_SIMS}`}
              tone="danger"
            />
            <MetricChip
              label="Expected by α"
              value={Math.round(alpha * N_SIMS)}
              unit={`/ ${N_SIMS}`}
              tone="muted"
            />
            <MetricChip
              label="Observed rate"
              value={fpRate.toFixed(1)}
              unit="%"
              tone={Math.abs(fpRate - alpha * 100) < 3 ? "ok" : "warn"}
            />
          </div>
        </div>
      </div>
      <figcaption className="mt-3 max-w-prose text-caption text-text-muted">
        Each bar is a bucket of p-values. Under a true null hypothesis, p-values are uniformly
        distributed — all bars should be roughly equal. The red bars (p &lt; α) are "significant"
        findings that appeared by chance alone. Click "New simulation" to see a fresh run.
      </figcaption>
    </figure>
  );
}

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

function SliderRow({
  label,
  value,
  min,
  max,
  step,
  onChange,
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  step: number;
  onChange: (v: number) => void;
}) {
  return (
    <label className="flex flex-col gap-1">
      <span className="text-body-sm text-text-secondary">{label}</span>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(parseFloat(e.target.value))}
        className="w-48 accent-accent-500"
      />
    </label>
  );
}

function MetricChip({
  label,
  value,
  unit,
  tone,
}: {
  label: string;
  value: number | string;
  unit: string;
  tone: "danger" | "muted" | "ok" | "warn";
}) {
  const color =
    tone === "danger"
      ? "rgb(var(--danger))"
      : tone === "ok"
        ? "rgb(var(--success))"
        : tone === "warn"
          ? "rgb(var(--warning))"
          : "rgb(var(--text-muted))";
  return (
    <div className="rounded-sm border border-border-subtle bg-canvas p-2.5">
      <div className="text-overline uppercase text-text-muted">{label}</div>
      <div className="mt-0.5 font-mono text-h4" style={{ color }}>
        {value} <span className="text-body-sm text-text-muted">{unit}</span>
      </div>
    </div>
  );
}
