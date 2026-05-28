"use client";

import { useMemo, useState } from "react";

/**
 * Bayes' rule playground for the probability lesson.
 *
 * Three sliders:
 *   - Prior P(disease) — the base rate
 *   - Sensitivity P(+ | disease) — true positive rate
 *   - Specificity P(− | not disease) — true negative rate
 *
 * Output: the posterior P(disease | +), computed via Bayes' rule, plus a
 * 10×10 grid visualization (100 squares = 100 people in a small population)
 * showing diseased vs healthy and true-positive vs false-positive squares.
 *
 * The base-rate fallacy becomes obvious: at low prior, even a 99% accurate
 * test produces mostly false positives among the positive results.
 */

const GRID_SIZE = 10; // 10×10 = 100 squares

export function BayesCalculator() {
  // Slider state. Prior on a log-ish scale for fine control at small base rates.
  const [prior, setPrior] = useState(0.05);
  const [sensitivity, setSensitivity] = useState(0.95);
  const [specificity, setSpecificity] = useState(0.95);

  // Bayes: P(D|+) = P(+|D)·P(D) / [P(+|D)·P(D) + P(+|¬D)·P(¬D)]
  const falsePositiveRate = 1 - specificity;
  const numerator = sensitivity * prior;
  const denominator = numerator + falsePositiveRate * (1 - prior);
  const posterior = denominator === 0 ? 0 : numerator / denominator;

  // Out of 1000 people:
  const N = 1000;
  const totalDiseased = N * prior;
  const totalHealthy = N - totalDiseased;
  const truePositives = totalDiseased * sensitivity;
  const falseNegatives = totalDiseased - truePositives;
  const falsePositives = totalHealthy * falsePositiveRate;
  const totalPositiveTests = truePositives + falsePositives;

  // Categorize each of 100 grid squares so the visual reads cleanly.
  // We render the squares in this order: TP, FN, FP, TN. The first
  // ⌈truePositives / 10⌉ squares are TP, etc.
  const squares = useMemo(() => {
    // Each square represents 10 people for a 1000-population.
    const arr: { kind: "TP" | "FN" | "FP" | "TN"; count: number }[] = [];
    const cells = GRID_SIZE * GRID_SIZE;
    // Distribute proportionally; cell-fill rounding kept simple.
    const tpCells = Math.round((truePositives / N) * cells);
    const fnCells = Math.round((falseNegatives / N) * cells);
    const fpCells = Math.round((falsePositives / N) * cells);
    let tnCells = cells - tpCells - fnCells - fpCells;
    if (tnCells < 0) tnCells = 0;
    for (let i = 0; i < tpCells; i += 1) arr.push({ kind: "TP", count: 10 });
    for (let i = 0; i < fnCells; i += 1) arr.push({ kind: "FN", count: 10 });
    for (let i = 0; i < fpCells; i += 1) arr.push({ kind: "FP", count: 10 });
    for (let i = 0; i < tnCells; i += 1) arr.push({ kind: "TN", count: 10 });
    return arr.slice(0, cells);
  }, [truePositives, falseNegatives, falsePositives, N]);

  const fillFor = (kind: "TP" | "FN" | "FP" | "TN") => {
    switch (kind) {
      case "TP":
        return "rgb(var(--success))";
      case "FN":
        return "rgb(var(--success) / 0.18)";
      case "FP":
        return "rgb(var(--danger))";
      case "TN":
        return "rgb(var(--viz-7) / 0.25)";
    }
  };

  return (
    <figure className="my-10">
      <div className="overflow-hidden rounded-lg border border-border-subtle bg-surface-raised shadow-md">
        <div className="grid gap-6 p-5 md:grid-cols-[auto_minmax(0,1fr)]">
          {/* Grid */}
          <div>
            <div className="mb-2 text-overline uppercase text-text-muted">Population of 1000</div>
            <div
              className="grid gap-0.5"
              style={{ gridTemplateColumns: `repeat(${GRID_SIZE}, 22px)` }}
            >
              {squares.map((sq, i) => (
                <span
                  key={i}
                  title={
                    sq.kind === "TP"
                      ? "True positive (sick, test+)"
                      : sq.kind === "FN"
                        ? "False negative (sick, test−)"
                        : sq.kind === "FP"
                          ? "False positive (healthy, test+)"
                          : "True negative (healthy, test−)"
                  }
                  className="block h-[22px] w-[22px] rounded-[2px]"
                  style={{ background: fillFor(sq.kind) }}
                />
              ))}
            </div>
            <div className="mt-3 grid grid-cols-2 gap-x-4 gap-y-1 text-caption">
              <LegendChip color="rgb(var(--success))" label="Sick, test +" />
              <LegendChip color="rgb(var(--success) / 0.18)" label="Sick, test −" />
              <LegendChip color="rgb(var(--danger))" label="Healthy, test +" />
              <LegendChip color="rgb(var(--viz-7) / 0.25)" label="Healthy, test −" />
            </div>
          </div>

          {/* Sliders + readout */}
          <div className="space-y-4">
            <SliderRow
              label="Prior  P(disease)"
              hint="The base rate in the population"
              value={prior}
              min={0.001}
              max={0.5}
              step={0.001}
              onChange={setPrior}
            />
            <SliderRow
              label="Sensitivity  P(+ | disease)"
              hint="True positive rate"
              value={sensitivity}
              min={0.5}
              max={1}
              step={0.005}
              onChange={setSensitivity}
            />
            <SliderRow
              label="Specificity  P(− | healthy)"
              hint="True negative rate"
              value={specificity}
              min={0.5}
              max={1}
              step={0.005}
              onChange={setSpecificity}
            />

            <div className="rounded-md border border-accent-100 bg-accent-50 p-4">
              <div className="text-overline uppercase text-accent-700">
                Posterior P(disease | positive)
              </div>
              <div className="mt-2 flex items-baseline gap-3">
                <span className="font-mono text-display text-accent-600">
                  {(posterior * 100).toFixed(1)}%
                </span>
                <span className="text-body-sm text-text-secondary">of positive tests are real</span>
              </div>
              <div className="mt-2 text-body-sm text-text-secondary">
                Out of <strong>{Math.round(totalPositiveTests)}</strong> positive tests,{" "}
                <strong>{Math.round(truePositives)}</strong> are real and{" "}
                <strong>{Math.round(falsePositives)}</strong> are false alarms.
              </div>
            </div>
          </div>
        </div>
      </div>
      <figcaption className="mt-3 max-w-prose text-caption text-text-muted">
        Try this: set prior to 0.01, sensitivity 0.99, specificity 0.99. The test is 99% accurate —
        but only about half of positive results are real. That's the base-rate fallacy. Then raise
        the prior to 0.10 and watch the posterior climb past 90%.
      </figcaption>
    </figure>
  );
}

function SliderRow({
  label,
  hint,
  value,
  min,
  max,
  step,
  onChange,
}: {
  label: string;
  hint: string;
  value: number;
  min: number;
  max: number;
  step: number;
  onChange: (v: number) => void;
}) {
  return (
    <label className="block">
      <div className="flex items-baseline justify-between">
        <span className="text-body-sm font-medium text-text-primary">{label}</span>
        <span className="font-mono text-body-sm text-text-secondary">
          {(value * 100).toFixed(value < 0.01 ? 2 : 1)}%
        </span>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(parseFloat(e.target.value))}
        className="mt-1 w-full accent-accent-500"
      />
      <div className="text-caption text-text-muted">{hint}</div>
    </label>
  );
}

function LegendChip({ color, label }: { color: string; label: string }) {
  return (
    <div className="flex items-center gap-2 text-text-secondary">
      <span className="inline-block h-2.5 w-2.5 rounded-[2px]" style={{ background: color }} />
      <span>{label}</span>
    </div>
  );
}
