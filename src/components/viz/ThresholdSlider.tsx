"use client";

import { useMemo, useState } from "react";

/**
 * Threshold slider for the evaluation-metrics lesson.
 *
 * A pre-baked synthetic dataset of 1000 samples (15% positive class) with
 * realistic-looking classifier scores. The user moves a threshold slider;
 * the confusion matrix, accuracy, precision, recall, and F1 all update
 * live. A small score histogram shows where the threshold cuts the
 * distribution.
 *
 * The pedagogical point: precision and recall move in opposite directions
 * as the threshold slides, and there's no single "right" threshold — it
 * depends on what each error type costs.
 */

const N_SAMPLES = 1000;
const POS_RATE = 0.15;

// Deterministic data so the slider doesn't shuffle results.
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
function sigmoid(z: number) {
  return 1 / (1 + Math.exp(-z));
}

function buildDataset(): { score: number; label: 0 | 1 }[] {
  const rng = mulberry32(123);
  const out: { score: number; label: 0 | 1 }[] = [];
  for (let i = 0; i < N_SAMPLES; i += 1) {
    const isPos = rng() < POS_RATE;
    // Positive samples skew toward 0.75; negatives toward 0.25. Realistic.
    const mean = isPos ? 1.3 : -1.3;
    const z = mean + 1.4 * gaussian(rng);
    out.push({ score: sigmoid(z), label: isPos ? 1 : 0 });
  }
  return out;
}

const HIST_BINS = 30;
const W = 720;
const H = 220;

export function ThresholdSlider() {
  const [threshold, setThreshold] = useState(0.5);

  const data = useMemo(() => buildDataset(), []);

  // Confusion matrix at the current threshold.
  const { tp, fp, tn, fn, total } = useMemo(() => {
    let tp = 0,
      fp = 0,
      tn = 0,
      fn = 0;
    for (const d of data) {
      const predicted = d.score >= threshold ? 1 : 0;
      if (predicted === 1 && d.label === 1) tp += 1;
      else if (predicted === 1 && d.label === 0) fp += 1;
      else if (predicted === 0 && d.label === 0) tn += 1;
      else fn += 1;
    }
    return { tp, fp, tn, fn, total: data.length };
  }, [data, threshold]);

  const accuracy = (tp + tn) / total;
  const precision = tp + fp === 0 ? 0 : tp / (tp + fp);
  const recall = tp + fn === 0 ? 0 : tp / (tp + fn);
  const f1 = precision + recall === 0 ? 0 : (2 * precision * recall) / (precision + recall);

  // Histograms of positive and negative scores.
  const { posBins, negBins, maxCount } = useMemo(() => {
    const posBins = new Array(HIST_BINS).fill(0);
    const negBins = new Array(HIST_BINS).fill(0);
    for (const d of data) {
      const bin = Math.min(HIST_BINS - 1, Math.floor(d.score * HIST_BINS));
      if (d.label === 1) posBins[bin] += 1;
      else negBins[bin] += 1;
    }
    const maxCount = Math.max(...posBins, ...negBins);
    return { posBins, negBins, maxCount };
  }, [data]);

  const binWidth = W / HIST_BINS;

  return (
    <figure className="my-10">
      <div className="overflow-hidden rounded-lg border border-border-subtle bg-surface-raised shadow-md">
        {/* Histogram */}
        <svg
          viewBox={`0 0 ${W} ${H}`}
          className="block h-auto w-full"
          aria-label="Score distribution histogram with threshold line"
        >
          {/* Negative class bars (below baseline, going down conceptually but drawn from middle for clarity) */}
          {negBins.map((count, i) => {
            const h = (count / maxCount) * (H * 0.45);
            return (
              <rect
                key={`n-${i}`}
                x={i * binWidth}
                y={H * 0.5}
                width={binWidth - 1}
                height={h}
                fill="rgb(var(--viz-7) / 0.65)"
              />
            );
          })}
          {/* Positive class bars (above baseline) */}
          {posBins.map((count, i) => {
            const h = (count / maxCount) * (H * 0.45);
            return (
              <rect
                key={`p-${i}`}
                x={i * binWidth}
                y={H * 0.5 - h}
                width={binWidth - 1}
                height={h}
                fill="rgb(var(--accent-500) / 0.85)"
              />
            );
          })}

          {/* Baseline */}
          <line
            x1={0}
            x2={W}
            y1={H * 0.5}
            y2={H * 0.5}
            stroke="rgb(var(--border-subtle))"
            strokeWidth={1}
          />

          {/* Threshold line */}
          <line
            x1={threshold * W}
            x2={threshold * W}
            y1={0}
            y2={H}
            stroke="rgb(var(--text-primary))"
            strokeWidth={2}
          />
          <rect
            x={threshold * W - 24}
            y={H * 0.5 - 12}
            width={48}
            height={24}
            rx={4}
            fill="rgb(var(--text-primary))"
          />
          <text
            x={threshold * W}
            y={H * 0.5 + 4}
            textAnchor="middle"
            fontSize="11"
            fontFamily="JetBrains Mono, monospace"
            fill="rgb(var(--bg-canvas))"
          >
            {threshold.toFixed(2)}
          </text>

          {/* Labels */}
          <text
            x={8}
            y={20}
            fontSize="11"
            fontFamily="Inter, sans-serif"
            fill="rgb(var(--accent-500))"
            fontWeight={600}
          >
            Positives (label = 1)
          </text>
          <text
            x={8}
            y={H - 10}
            fontSize="11"
            fontFamily="Inter, sans-serif"
            fill="rgb(var(--viz-7))"
            fontWeight={600}
          >
            Negatives (label = 0)
          </text>
          <text x={4} y={H * 0.5 - 4} fontSize="10" fill="rgb(var(--text-muted))">
            0.0
          </text>
          <text x={W - 22} y={H * 0.5 - 4} fontSize="10" fill="rgb(var(--text-muted))">
            1.0
          </text>
        </svg>

        {/* Controls + metrics */}
        <div className="border-t border-border-subtle bg-surface p-4">
          <label className="flex flex-wrap items-center gap-3">
            <span className="text-overline uppercase text-text-muted">Decision threshold</span>
            <input
              type="range"
              min={0}
              max={1}
              step={0.01}
              value={threshold}
              onChange={(e) => setThreshold(parseFloat(e.target.value))}
              className="w-64 accent-accent-500"
            />
            <span className="w-14 font-mono text-h4 text-text-primary">{threshold.toFixed(2)}</span>
          </label>

          {/* Confusion matrix */}
          <div className="mt-5 grid gap-4 md:grid-cols-[auto_minmax(0,1fr)]">
            <ConfusionMatrix tp={tp} fp={fp} tn={tn} fn={fn} />

            <div className="grid grid-cols-2 gap-3">
              <Metric label="Accuracy" value={accuracy} tone="neutral" />
              <Metric label="F1 score" value={f1} tone="accent" />
              <Metric label="Precision" value={precision} tone="viz2" />
              <Metric label="Recall" value={recall} tone="viz3" />
            </div>
          </div>
        </div>
      </div>
      <figcaption className="mt-3 max-w-prose text-caption text-text-muted">
        Synthetic classifier scores on 1000 samples (15% positive). Slide the threshold — precision
        and recall move in opposite directions. Try threshold 0.1 vs 0.9 and watch what happens.
      </figcaption>
    </figure>
  );
}

function ConfusionMatrix({ tp, fp, tn, fn }: { tp: number; fp: number; tn: number; fn: number }) {
  return (
    <div className="inline-block">
      <div className="grid grid-cols-[auto_repeat(2,80px)] gap-px">
        <div />
        <div className="px-2 py-1 text-center text-overline uppercase text-text-muted">
          Actual +
        </div>
        <div className="px-2 py-1 text-center text-overline uppercase text-text-muted">
          Actual −
        </div>

        <div className="px-2 py-2 text-right text-overline uppercase text-text-muted">Pred +</div>
        <div className="border border-success bg-success/10 px-2 py-2 text-center">
          <div className="text-caption text-text-muted">TP</div>
          <div className="font-mono text-h4 text-success">{tp}</div>
        </div>
        <div className="border border-danger bg-danger/10 px-2 py-2 text-center">
          <div className="text-caption text-text-muted">FP</div>
          <div className="font-mono text-h4 text-danger">{fp}</div>
        </div>

        <div className="px-2 py-2 text-right text-overline uppercase text-text-muted">Pred −</div>
        <div className="border border-danger bg-danger/10 px-2 py-2 text-center">
          <div className="text-caption text-text-muted">FN</div>
          <div className="font-mono text-h4 text-danger">{fn}</div>
        </div>
        <div className="border border-success bg-success/10 px-2 py-2 text-center">
          <div className="text-caption text-text-muted">TN</div>
          <div className="font-mono text-h4 text-success">{tn}</div>
        </div>
      </div>
    </div>
  );
}

function Metric({
  label,
  value,
  tone,
}: {
  label: string;
  value: number;
  tone: "neutral" | "accent" | "viz2" | "viz3";
}) {
  const color =
    tone === "accent"
      ? "rgb(var(--accent-500))"
      : tone === "viz2"
        ? "rgb(var(--viz-2))"
        : tone === "viz3"
          ? "rgb(var(--viz-3))"
          : "rgb(var(--text-primary))";
  return (
    <div className="rounded-sm border border-border-subtle bg-canvas p-3">
      <div className="text-overline uppercase text-text-muted">{label}</div>
      <div className="mt-1 font-mono text-h4" style={{ color }}>
        {(value * 100).toFixed(1)}%
      </div>
    </div>
  );
}
