"use client";

import { useMemo, useState } from "react";

/**
 * Weight initialisation demo for A4.6.
 *
 * Simulates forward pass through a 6-layer ReLU MLP with three init strategies:
 *   - "tiny": N(0, 0.01) — activations vanish
 *   - "he":   N(0, sqrt(2/n_in)) — activations stable
 *   - "big":  N(0, 1) — activations explode
 *
 * For each layer, computes the standard deviation of activations over a batch
 * of synthetic inputs and renders them as bars; the height of the bar shows
 * the activation magnitude. Watch healthy vs broken initialisation across
 * 6 layers.
 */

const LAYERS = 6;
const HIDDEN = 256;
const BATCH = 64;

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

type InitKey = "tiny" | "he" | "big";

const INIT_LABELS: Record<InitKey, { label: string; description: string }> = {
  tiny: {
    label: "Too small: N(0, 0.01)",
    description:
      "Weights too small → activations shrink through each layer. By layer 6, the std is near zero — gradients can't propagate, training stalls.",
  },
  he: {
    label: "He / Kaiming: N(0, √(2/n_in))",
    description:
      "The correct scale for ReLU. Activation std stays roughly constant across layers. Gradients flow back cleanly. This is the PyTorch default.",
  },
  big: {
    label: "Too large: N(0, 1)",
    description:
      "Weights too large → activations explode exponentially through layers. Numerical overflow or NaN within a few layers in practice.",
  },
};

function simulateForwardStds(initKey: InitKey, seed: number): number[] {
  const rng = mulberry32(seed);
  // Start with input activations ~ N(0, 1)
  let activations: number[][] = Array.from({ length: BATCH }, () =>
    Array.from({ length: HIDDEN }, () => gaussian(rng))
  );

  const stds: number[] = [];
  // Compute std of input
  stds.push(stdOfMatrix(activations));

  for (let l = 0; l < LAYERS; l += 1) {
    // Build a random weight matrix W (HIDDEN x HIDDEN) for this layer.
    const stdW = initKey === "tiny" ? 0.01 : initKey === "he" ? Math.sqrt(2 / HIDDEN) : 1;
    const W: number[][] = Array.from({ length: HIDDEN }, () =>
      Array.from({ length: HIDDEN }, () => stdW * gaussian(rng))
    );

    // Compute new activations: z = Wx, then ReLU.
    const newActivations: number[][] = [];
    for (let b = 0; b < BATCH; b += 1) {
      const row = new Array<number>(HIDDEN);
      for (let i = 0; i < HIDDEN; i += 1) {
        let s = 0;
        const xRow = activations[b];
        const wRow = W[i];
        for (let j = 0; j < HIDDEN; j += 1) s += wRow[j] * xRow[j];
        row[i] = Math.max(0, s); // ReLU
      }
      newActivations.push(row);
    }
    activations = newActivations;
    stds.push(stdOfMatrix(activations));
  }
  return stds;
}

function stdOfMatrix(m: number[][]): number {
  let n = 0;
  let mean = 0;
  for (const row of m) {
    for (const v of row) {
      mean += v;
      n += 1;
    }
  }
  mean /= n;
  let s = 0;
  for (const row of m) {
    for (const v of row) {
      s += (v - mean) ** 2;
    }
  }
  return Math.sqrt(s / n);
}

export function WeightInitDemo() {
  const [active, setActive] = useState<InitKey>("he");

  const stds = useMemo(() => simulateForwardStds(active, 31), [active]);

  // For display, clamp to a reasonable max so the chart stays readable.
  const displayMax = 5;
  const W_SVG = 720;
  const H_SVG = 260;
  const barW = (W_SVG - 60) / (LAYERS + 1);
  const baseY = H_SVG - 30;

  return (
    <figure className="my-10">
      <div className="overflow-hidden rounded-lg border border-border-subtle bg-surface-raised shadow-md">
        <div className="flex flex-wrap gap-2 border-b border-border-subtle bg-surface p-3">
          {(Object.keys(INIT_LABELS) as InitKey[]).map((k) => (
            <button
              key={k}
              onClick={() => setActive(k)}
              className={`rounded-sm border px-3 py-1 text-body-sm ${
                k === active
                  ? "border-accent-500 bg-accent-500/10 text-accent-500"
                  : "border-border-subtle text-text-secondary"
              }`}
            >
              {INIT_LABELS[k].label}
            </button>
          ))}
        </div>

        <div className="p-4">
          <div className="text-overline uppercase text-text-muted">
            Activation std at each layer (input → layer 6)
          </div>
          <svg viewBox={`0 0 ${W_SVG} ${H_SVG}`} className="mt-2 block h-auto w-full">
            <line
              x1={40}
              y1={baseY}
              x2={W_SVG - 20}
              y2={baseY}
              stroke="rgb(var(--border-subtle))"
            />
            <text x={4} y={baseY + 4} fontSize={11} fill="rgb(var(--text-muted))">
              0
            </text>
            <text x={4} y={baseY - 200} fontSize={11} fill="rgb(var(--text-muted))">
              {displayMax}
            </text>
            <line
              x1={40}
              y1={baseY - 200}
              x2={W_SVG - 20}
              y2={baseY - 200}
              stroke="rgb(var(--border-subtle))"
              strokeDasharray="2 4"
            />

            {stds.map((s, i) => {
              const clipped = Math.min(displayMax, s);
              const tooBig = s > displayMax;
              const tooSmall = s < 0.01;
              const x = 60 + i * barW;
              const h = (clipped / displayMax) * 200;
              const color = tooBig
                ? "rgb(var(--warning))"
                : tooSmall
                  ? "rgb(var(--text-muted))"
                  : "rgb(var(--accent-500))";
              return (
                <g key={`bar-${i}`}>
                  <rect
                    x={x}
                    y={baseY - h}
                    width={barW * 0.7}
                    height={h}
                    fill={color}
                    opacity={0.85}
                  />
                  <text
                    x={x + (barW * 0.7) / 2}
                    y={baseY + 16}
                    textAnchor="middle"
                    fontSize={11}
                    fill="rgb(var(--text-muted))"
                  >
                    {i === 0 ? "in" : `L${i}`}
                  </text>
                  <text
                    x={x + (barW * 0.7) / 2}
                    y={baseY - h - 6}
                    textAnchor="middle"
                    fontSize={10}
                    fill="rgb(var(--text-primary))"
                    fontFamily="monospace"
                  >
                    {tooBig ? `${s.toExponential(1)}` : s.toFixed(2)}
                  </text>
                </g>
              );
            })}
          </svg>
        </div>

        <div className="border-t border-border-subtle bg-surface p-4">
          <p className="text-body-sm text-text-secondary">{INIT_LABELS[active].description}</p>
        </div>
      </div>
      <figcaption className="mt-3 max-w-prose text-caption text-text-muted">
        Forward pass through a 6-layer 256-wide ReLU MLP with batch size 64. Bars show the standard
        deviation of activations at each layer. The He / Kaiming init keeps the std roughly constant
        — the property that makes deep networks trainable.
      </figcaption>
    </figure>
  );
}
