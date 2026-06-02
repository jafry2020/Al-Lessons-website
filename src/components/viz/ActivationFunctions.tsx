"use client";

import { useMemo, useState } from "react";

/**
 * Activation function viewer for A4.2.
 *
 * Two stacked panels: top shows σ(z), bottom shows σ'(z), for the user-selected
 * activation. Lets students see why sigmoid saturates (derivative → 0 in tails),
 * why ReLU has constant gradient on one side, etc.
 */

const W = 720;
const H = 200;
const Z_MIN = -5;
const Z_MAX = 5;

const sx = (z: number) => ((z - Z_MIN) / (Z_MAX - Z_MIN)) * W;
const syValueTop = (y: number, range: [number, number]) =>
  H - ((y - range[0]) / (range[1] - range[0])) * H;

type ActivationKey = "relu" | "sigmoid" | "tanh" | "gelu";

const ACTIVATIONS: Record<
  ActivationKey,
  {
    label: string;
    fn: (z: number) => number;
    deriv: (z: number) => number;
    range: [number, number];
    derivRange: [number, number];
    description: string;
  }
> = {
  relu: {
    label: "ReLU",
    fn: (z) => Math.max(0, z),
    deriv: (z) => (z > 0 ? 1 : 0),
    range: [-0.5, 5],
    derivRange: [-0.1, 1.2],
    description:
      "ReLU(z) = max(0, z). Cheap, sparse, no vanishing on the active side. Default for vision and basic MLPs.",
  },
  sigmoid: {
    label: "Sigmoid",
    fn: (z) => 1 / (1 + Math.exp(-z)),
    deriv: (z) => {
      const s = 1 / (1 + Math.exp(-z));
      return s * (1 - s);
    },
    range: [-0.1, 1.1],
    derivRange: [-0.05, 0.3],
    description:
      "σ(z) = 1/(1+e⁻ᶻ). Saturates in both tails — derivative vanishes for |z| > 4. Avoid in deep hidden layers; use for binary output only.",
  },
  tanh: {
    label: "tanh",
    fn: Math.tanh,
    deriv: (z) => 1 - Math.tanh(z) ** 2,
    range: [-1.2, 1.2],
    derivRange: [-0.1, 1.2],
    description:
      "tanh(z). Zero-centred output, derivative peaks at 1 at z=0. Better than sigmoid for hidden layers; replaced by ReLU/GELU in most modern networks.",
  },
  gelu: {
    label: "GELU",
    fn: (z) => 0.5 * z * (1 + Math.tanh(Math.sqrt(2 / Math.PI) * (z + 0.044715 * z ** 3))),
    deriv: (z) => {
      // Numerical derivative for simplicity
      const eps = 1e-4;
      const f = (zz: number) =>
        0.5 * zz * (1 + Math.tanh(Math.sqrt(2 / Math.PI) * (zz + 0.044715 * zz ** 3)));
      return (f(z + eps) - f(z - eps)) / (2 * eps);
    },
    range: [-0.5, 5],
    derivRange: [-0.2, 1.3],
    description:
      "GELU(z) ≈ z·Φ(z), smooth approximation of ReLU. Used in BERT, GPT-2/3, T5. Slight empirical gain over ReLU in transformers.",
  },
};

export function ActivationFunctions() {
  const [active, setActive] = useState<ActivationKey>("relu");
  const cfg = ACTIVATIONS[active];

  const valuePath = useMemo(() => {
    const N = 240;
    const pts: string[] = [];
    for (let i = 0; i <= N; i += 1) {
      const z = Z_MIN + (i / N) * (Z_MAX - Z_MIN);
      const v = cfg.fn(z);
      pts.push(`${sx(z)},${syValueTop(v, cfg.range)}`);
    }
    return pts.join(" ");
  }, [cfg]);

  const derivPath = useMemo(() => {
    const N = 240;
    const pts: string[] = [];
    for (let i = 0; i <= N; i += 1) {
      const z = Z_MIN + (i / N) * (Z_MAX - Z_MIN);
      const v = cfg.deriv(z);
      pts.push(`${sx(z)},${syValueTop(v, cfg.derivRange)}`);
    }
    return pts.join(" ");
  }, [cfg]);

  return (
    <figure className="my-10">
      <div className="overflow-hidden rounded-lg border border-border-subtle bg-surface-raised shadow-md">
        <div className="flex flex-wrap gap-2 border-b border-border-subtle bg-surface p-3">
          {(Object.keys(ACTIVATIONS) as ActivationKey[]).map((k) => (
            <button
              key={k}
              onClick={() => setActive(k)}
              className={`rounded-sm border px-3 py-1 text-body-sm ${
                k === active
                  ? "border-accent-500 bg-accent-500/10 text-accent-500"
                  : "border-border-subtle text-text-secondary"
              }`}
            >
              {ACTIVATIONS[k].label}
            </button>
          ))}
        </div>

        <div className="p-4">
          <div className="text-overline uppercase text-text-muted">Value σ(z)</div>
          <svg viewBox={`0 0 ${W} ${H}`} className="mt-2 block h-auto w-full">
            <line x1={sx(0)} y1={0} x2={sx(0)} y2={H} stroke="rgb(var(--border-subtle))" />
            <line
              x1={0}
              y1={syValueTop(0, cfg.range)}
              x2={W}
              y2={syValueTop(0, cfg.range)}
              stroke="rgb(var(--border-subtle))"
            />
            <polyline
              points={valuePath}
              fill="none"
              stroke="rgb(var(--accent-500))"
              strokeWidth={2.5}
            />
          </svg>
        </div>

        <div className="border-t border-border-subtle p-4">
          <div className="text-overline uppercase text-text-muted">
            Derivative σ&apos;(z) — the gradient that flows back during training
          </div>
          <svg viewBox={`0 0 ${W} ${H}`} className="mt-2 block h-auto w-full">
            <line x1={sx(0)} y1={0} x2={sx(0)} y2={H} stroke="rgb(var(--border-subtle))" />
            <line
              x1={0}
              y1={syValueTop(0, cfg.derivRange)}
              x2={W}
              y2={syValueTop(0, cfg.derivRange)}
              stroke="rgb(var(--border-subtle))"
            />
            <polyline points={derivPath} fill="none" stroke="rgb(var(--viz-2))" strokeWidth={2.5} />
          </svg>
        </div>

        <div className="border-t border-border-subtle bg-surface p-4">
          <p className="text-body-sm text-text-secondary">{cfg.description}</p>
        </div>
      </div>
      <figcaption className="mt-3 max-w-prose text-caption text-text-muted">
        The bottom panel — the derivative — is what propagates during backpropagation.
        Sigmoid&apos;s near-zero derivative in the tails is exactly why deep networks of sigmoids
        stopped training. ReLU&apos;s flat 1 on the active side is why deeper networks suddenly
        worked.
      </figcaption>
    </figure>
  );
}
