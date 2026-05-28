"use client";

import { useMemo, useState } from "react";

/**
 * Distribution explorer for the "Distributions in the wild" lesson.
 *
 * Four distribution families (Normal, Uniform, Exponential, Binomial) with
 * parameter sliders. Plots the PDF (continuous) or PMF (discrete) as an SVG.
 * Key statistics update live. All data is deterministic given the slider state —
 * no randomness in the rendering.
 */

const W = 680;
const H = 270;
const L = 12; // left margin inside SVG
const R = 12; // right margin
const T = 12; // top margin
const B = 36; // bottom margin (for x labels)
const PLOT_W = W - L - R;
const PLOT_H = H - T - B;

type DistType = "normal" | "uniform" | "exponential" | "binomial";

// ---------------------------------------------------------------------------
// Math helpers
// ---------------------------------------------------------------------------

function normalPDF(x: number, mu: number, sigma: number): number {
  const z = (x - mu) / sigma;
  return Math.exp(-0.5 * z * z) / (sigma * Math.sqrt(2 * Math.PI));
}

function binomCoeff(n: number, k: number): number {
  if (k < 0 || k > n) return 0;
  if (k === 0 || k === n) return 1;
  const kk = Math.min(k, n - k);
  let r = 1;
  for (let i = 0; i < kk; i++) r = (r * (n - i)) / (i + 1);
  return r;
}

function binomPMF(k: number, n: number, p: number): number {
  if (k < 0 || k > n) return 0;
  return binomCoeff(n, k) * Math.pow(p, k) * Math.pow(1 - p, n - k);
}

// ---------------------------------------------------------------------------
// Coordinate helpers
// ---------------------------------------------------------------------------

function makeAxes(xMin: number, xMax: number, yMax: number) {
  const toSX = (x: number) => L + ((x - xMin) / (xMax - xMin)) * PLOT_W;
  const toSY = (y: number) => T + PLOT_H - (y / yMax) * PLOT_H;
  return { toSX, toSY };
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function DistributionExplorer() {
  const [dist, setDist] = useState<DistType>("normal");
  const [mu, setMu] = useState(0);
  const [sigma, setSigma] = useState(1);
  const [uniA, setUniA] = useState(-2);
  const [uniB, setUniB] = useState(2);
  const [lambda, setLambda] = useState(1);
  const [binoN, setBinoN] = useState(20);
  const [binoP, setBinoP] = useState(0.4);

  // Clamp uniform so a < b always.
  const a = Math.min(uniA, uniB - 0.2);
  const b = Math.max(uniB, uniA + 0.2);

  interface DistData {
    xMin: number;
    xMax: number;
    yMax: number;
    isContinuous: boolean;
    pts: { x: number; y: number }[];
    mean: number;
    variance: number;
  }

  const data = useMemo((): DistData => {
    switch (dist) {
      case "normal": {
        const xMin = mu - 4 * sigma;
        const xMax = mu + 4 * sigma;
        const N = 200;
        const pts: { x: number; y: number }[] = [];
        for (let i = 0; i <= N; i++) {
          const x = xMin + (i / N) * (xMax - xMin);
          pts.push({ x, y: normalPDF(x, mu, sigma) });
        }
        const peak = normalPDF(mu, mu, sigma);
        return {
          xMin,
          xMax,
          yMax: peak * 1.15,
          isContinuous: true,
          pts,
          mean: mu,
          variance: sigma * sigma,
        };
      }
      case "uniform": {
        const height = 1 / (b - a);
        const pad = (b - a) * 0.3;
        const xMin = a - pad;
        const xMax = b + pad;
        const pts: { x: number; y: number }[] = [
          { x: xMin, y: 0 },
          { x: a, y: 0 },
          { x: a, y: height },
          { x: b, y: height },
          { x: b, y: 0 },
          { x: xMax, y: 0 },
        ];
        return {
          xMin,
          xMax,
          yMax: height * 1.4,
          isContinuous: true,
          pts,
          mean: (a + b) / 2,
          variance: (b - a) ** 2 / 12,
        };
      }
      case "exponential": {
        const xMin = 0;
        const xMax = 5 / lambda;
        const N = 200;
        const pts: { x: number; y: number }[] = [];
        for (let i = 0; i <= N; i++) {
          const x = (i / N) * xMax;
          pts.push({ x, y: lambda * Math.exp(-lambda * x) });
        }
        return {
          xMin,
          xMax,
          yMax: lambda * 1.15,
          isContinuous: true,
          pts,
          mean: 1 / lambda,
          variance: 1 / (lambda * lambda),
        };
      }
      case "binomial": {
        const pts: { x: number; y: number }[] = [];
        for (let k = 0; k <= binoN; k++) pts.push({ x: k, y: binomPMF(k, binoN, binoP) });
        const yMax = Math.max(...pts.map((p) => p.y)) * 1.25;
        return {
          xMin: -0.5,
          xMax: binoN + 0.5,
          yMax,
          isContinuous: false,
          pts,
          mean: binoN * binoP,
          variance: binoN * binoP * (1 - binoP),
        };
      }
    }
  }, [dist, mu, sigma, a, b, lambda, binoN, binoP]);

  const { toSX, toSY } = makeAxes(data.xMin, data.xMax, data.yMax);

  // Build SVG elements for the curve / bars.
  const baseLine = toSY(0);

  const fillPath = data.isContinuous
    ? `M ${toSX(data.pts[0].x).toFixed(1)} ${baseLine.toFixed(1)} ` +
      data.pts.map((p) => `L ${toSX(p.x).toFixed(1)} ${toSY(p.y).toFixed(1)}`).join(" ") +
      ` L ${toSX(data.pts[data.pts.length - 1].x).toFixed(1)} ${baseLine.toFixed(1)} Z`
    : "";

  const strokePoints = data.isContinuous
    ? data.pts.map((p) => `${toSX(p.x).toFixed(1)},${toSY(p.y).toFixed(1)}`).join(" ")
    : "";

  const barW = data.isContinuous ? 0 : Math.max(3, (PLOT_W / (data.pts.length + 2)) * 0.7);

  // Five evenly-spaced x-axis labels.
  const xLabels = [0, 0.25, 0.5, 0.75, 1].map((t) => {
    const val = data.xMin + t * (data.xMax - data.xMin);
    return { sx: toSX(val), label: Math.abs(val) < 100 ? val.toFixed(1) : val.toFixed(0) };
  });

  const DISTS: { key: DistType; label: string }[] = [
    { key: "normal", label: "Normal" },
    { key: "uniform", label: "Uniform" },
    { key: "exponential", label: "Exponential" },
    { key: "binomial", label: "Binomial" },
  ];

  const stddev = Math.sqrt(data.variance);

  return (
    <figure className="my-10">
      <div className="overflow-hidden rounded-lg border border-border-subtle bg-surface-raised shadow-md">
        {/* Tab bar */}
        <div className="flex border-b border-border-subtle">
          {DISTS.map(({ key, label }) => (
            <button
              key={key}
              onClick={() => setDist(key)}
              className={`flex-1 py-2.5 text-body-sm font-medium transition-colors ${
                dist === key
                  ? "border-b-2 border-accent-500 bg-subtle text-accent-600"
                  : "text-text-muted hover:bg-subtle/50 hover:text-text-secondary"
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        <div className="p-4">
          {/* SVG plot */}
          <svg
            viewBox={`0 0 ${W} ${H}`}
            className="block h-auto w-full"
            aria-label={`${dist} distribution PDF plot`}
          >
            {/* Baseline */}
            <line
              x1={L}
              y1={baseLine}
              x2={L + PLOT_W}
              y2={baseLine}
              stroke="rgb(var(--border-subtle))"
              strokeWidth={1}
            />

            {/* Filled area (continuous distributions only) */}
            {data.isContinuous && <path d={fillPath} fill="rgb(var(--accent-500) / 0.12)" />}

            {/* Stroke curve (continuous) */}
            {data.isContinuous && (
              <polyline
                points={strokePoints}
                fill="none"
                stroke="rgb(var(--accent-500))"
                strokeWidth={2.5}
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            )}

            {/* Bars (discrete) */}
            {!data.isContinuous &&
              data.pts.map((p) => {
                const bx = toSX(p.x);
                const by = toSY(p.y);
                return (
                  <rect
                    key={p.x}
                    x={bx - barW / 2}
                    y={by}
                    width={barW}
                    height={Math.max(0, baseLine - by)}
                    fill="rgb(var(--accent-500) / 0.85)"
                    rx={2}
                  />
                );
              })}

            {/* X axis labels */}
            {xLabels.map(({ sx, label }) => (
              <text
                key={label}
                x={sx}
                y={T + PLOT_H + 20}
                textAnchor="middle"
                fontSize={11}
                fill="rgb(var(--text-muted))"
              >
                {label}
              </text>
            ))}

            {/* Distribution label overlay */}
            <text
              x={L + 8}
              y={T + 18}
              fontSize={12}
              fill="rgb(var(--text-muted))"
              fontFamily="monospace"
            >
              {dist === "normal" && `N(μ=${mu.toFixed(1)}, σ=${sigma.toFixed(1)})`}
              {dist === "uniform" && `Uniform(${a.toFixed(1)}, ${b.toFixed(1)})`}
              {dist === "exponential" && `Exp(λ=${lambda.toFixed(1)})`}
              {dist === "binomial" && `Bin(n=${binoN}, p=${binoP.toFixed(2)})`}
            </text>
          </svg>

          {/* Parameter sliders */}
          <div className="mt-2 space-y-2 border-t border-border-subtle pt-3">
            {dist === "normal" && (
              <>
                <SliderRow
                  label="Mean μ"
                  value={mu}
                  min={-3}
                  max={3}
                  step={0.1}
                  fmt={(v) => v.toFixed(1)}
                  onChange={setMu}
                />
                <SliderRow
                  label="Std dev σ"
                  value={sigma}
                  min={0.2}
                  max={3}
                  step={0.1}
                  fmt={(v) => v.toFixed(1)}
                  onChange={setSigma}
                />
              </>
            )}
            {dist === "uniform" && (
              <>
                <SliderRow
                  label="Lower bound a"
                  value={uniA}
                  min={-4}
                  max={-0.1}
                  step={0.1}
                  fmt={(v) => v.toFixed(1)}
                  onChange={setUniA}
                />
                <SliderRow
                  label="Upper bound b"
                  value={uniB}
                  min={0.1}
                  max={4}
                  step={0.1}
                  fmt={(v) => v.toFixed(1)}
                  onChange={setUniB}
                />
              </>
            )}
            {dist === "exponential" && (
              <SliderRow
                label="Rate λ"
                value={lambda}
                min={0.2}
                max={4}
                step={0.1}
                fmt={(v) => v.toFixed(1)}
                onChange={setLambda}
              />
            )}
            {dist === "binomial" && (
              <>
                <SliderRow
                  label="Trials n"
                  value={binoN}
                  min={5}
                  max={40}
                  step={1}
                  fmt={(v) => String(v)}
                  onChange={setBinoN}
                />
                <SliderRow
                  label="Probability p"
                  value={binoP}
                  min={0.05}
                  max={0.95}
                  step={0.05}
                  fmt={(v) => v.toFixed(2)}
                  onChange={setBinoP}
                />
              </>
            )}
          </div>

          {/* Stats readout */}
          <div className="mt-3 grid grid-cols-3 gap-2">
            <StatChip label="Mean" value={data.mean.toFixed(3)} />
            <StatChip label="Variance" value={data.variance.toFixed(3)} />
            <StatChip label="Std dev" value={stddev.toFixed(3)} />
          </div>
        </div>
      </div>
      <figcaption className="mt-3 max-w-prose text-caption text-text-muted">
        Switch distributions and drag the parameter sliders to see how the shape changes. Try making
        the Normal very narrow (σ ≈ 0.2) or very wide (σ ≈ 3). On Exponential, raise λ to see how
        the distribution shifts left as the mean (1/λ) shrinks.
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
  fmt,
  onChange,
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  step: number;
  fmt: (v: number) => string;
  onChange: (v: number) => void;
}) {
  return (
    <label className="flex items-center gap-3">
      <span className="w-32 shrink-0 text-body-sm text-text-secondary">{label}</span>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(parseFloat(e.target.value))}
        className="flex-1 accent-accent-500"
      />
      <span className="w-10 text-right font-mono text-body-sm text-text-primary">{fmt(value)}</span>
    </label>
  );
}

function StatChip({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-sm border border-border-subtle bg-canvas p-2.5">
      <div className="text-overline uppercase text-text-muted">{label}</div>
      <div className="mt-0.5 font-mono text-body text-accent-600">{value}</div>
    </div>
  );
}
