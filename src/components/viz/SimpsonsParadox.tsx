"use client";

import { useState } from "react";

/**
 * Simpson's paradox interactive for the correlation-causation lesson.
 *
 * Context: two treatments (A and B) are applied to patients with either
 * mild or severe cases. Treatment A has a higher success rate than B in
 * BOTH subgroups. But because Treatment B is preferentially given to mild
 * (easier) cases, B can look better in the overall comparison.
 *
 * The slider controls what fraction of Treatment B's patients have mild
 * cases. Students drag it right and watch the "Overall" bar for B rise
 * past A's — even though A beats B in both subgroups the whole time.
 *
 * Fixed parameters:
 *   Treatment A: 20% mild / 80% severe (fixed allocation)
 *   Mild success:   A = 80%,  B = 70%
 *   Severe success: A = 50%,  B = 40%
 *   A overall (fixed) = 0.20×80% + 0.80×50% = 56%
 *   Paradox flips when B mild fraction > ~53%
 */

const W = 680;
const H = 320;
const Y_BOTTOM = 270;
const Y_TOP = 24;
const PLOT_H = Y_BOTTOM - Y_TOP; // 246
const BAR_W = 38;

// Cluster centre x positions.
const CLUSTERS = [
  { label: "Mild Cases", x: 150 },
  { label: "Severe Cases", x: 360 },
  { label: "Overall", x: 570 },
] as const;

// Fixed success rates within each group.
const RATE = { mildA: 0.8, mildB: 0.7, severeA: 0.5, severeB: 0.4 };
// A's fixed allocation.
const A_MILD_FRAC = 0.2;
const A_OVERALL = A_MILD_FRAC * RATE.mildA + (1 - A_MILD_FRAC) * RATE.severeA; // 0.56

function barTop(rate: number): number {
  return Y_BOTTOM - rate * PLOT_H;
}

function pct(rate: number): string {
  return `${Math.round(rate * 100)}%`;
}

export function SimpsonsParadox() {
  const [bMildFrac, setBMildFrac] = useState(0.2);

  const bOverall = bMildFrac * RATE.mildB + (1 - bMildFrac) * RATE.severeB;
  const paradoxActive = bOverall > A_OVERALL;

  const aColor = "rgb(var(--accent-500))";
  const bColor = "rgb(var(--viz-2))";

  type ClusterData = {
    rateA: number;
    rateB: number;
    aBetter: boolean;
  };

  const clusterData: ClusterData[] = [
    { rateA: RATE.mildA, rateB: RATE.mildB, aBetter: true },
    { rateA: RATE.severeA, rateB: RATE.severeB, aBetter: true },
    { rateA: A_OVERALL, rateB: bOverall, aBetter: A_OVERALL >= bOverall },
  ];

  return (
    <figure className="my-10">
      <div className="overflow-hidden rounded-lg border border-border-subtle bg-surface-raised shadow-md">
        <svg
          viewBox={`0 0 ${W} ${H}`}
          className="block h-auto w-full"
          aria-label="Grouped bar chart showing Simpson's paradox"
        >
          {/* Baseline */}
          <line
            x1={30}
            y1={Y_BOTTOM}
            x2={W - 20}
            y2={Y_BOTTOM}
            stroke="rgb(var(--border-subtle))"
            strokeWidth={1}
          />

          {/* Y reference lines at 25%, 50%, 75% */}
          {[0.25, 0.5, 0.75].map((r) => {
            const y = barTop(r);
            return (
              <g key={r}>
                <line
                  x1={30}
                  y1={y}
                  x2={W - 20}
                  y2={y}
                  stroke="rgb(var(--border-subtle))"
                  strokeWidth={0.75}
                  strokeDasharray="3 3"
                />
                <text x={26} y={y + 4} textAnchor="end" fontSize={10} fill="rgb(var(--text-muted))">
                  {Math.round(r * 100)}%
                </text>
              </g>
            );
          })}

          {/* Cluster bars */}
          {CLUSTERS.map((c, ci) => {
            const d = clusterData[ci];
            const isOverall = ci === 2;
            return (
              <g key={c.label}>
                {/* Cluster label */}
                <text
                  x={c.x}
                  y={Y_BOTTOM + 18}
                  textAnchor="middle"
                  fontSize={12}
                  fontWeight={isOverall ? 600 : 400}
                  fill={isOverall ? "rgb(var(--text-primary))" : "rgb(var(--text-secondary))"}
                >
                  {c.label}
                </text>

                {/* Bar A */}
                <rect
                  x={c.x - BAR_W - 4}
                  y={barTop(d.rateA)}
                  width={BAR_W}
                  height={d.rateA * PLOT_H}
                  fill={aColor}
                  rx={3}
                  opacity={0.9}
                />
                <text
                  x={c.x - BAR_W / 2 - 4}
                  y={barTop(d.rateA) - 5}
                  textAnchor="middle"
                  fontSize={11}
                  fontWeight={600}
                  fill="rgb(var(--text-primary))"
                >
                  {pct(d.rateA)}
                </text>

                {/* Bar B */}
                <rect
                  x={c.x + 4}
                  y={barTop(d.rateB)}
                  width={BAR_W}
                  height={d.rateB * PLOT_H}
                  fill={bColor}
                  rx={3}
                  opacity={0.9}
                />
                <text
                  x={c.x + BAR_W / 2 + 4}
                  y={barTop(d.rateB) - 5}
                  textAnchor="middle"
                  fontSize={11}
                  fontWeight={600}
                  fill="rgb(var(--text-primary))"
                >
                  {pct(d.rateB)}
                </text>

                {/* Winner annotation (below label) */}
                <text
                  x={c.x}
                  y={Y_BOTTOM + 34}
                  textAnchor="middle"
                  fontSize={10}
                  fill={isOverall && paradoxActive ? "rgb(var(--danger))" : "rgb(var(--success))"}
                >
                  {d.aBetter ? "A wins here ✓" : "B wins here !"}
                </text>

                {/* Vertical divider between groups */}
                {ci < CLUSTERS.length - 1 && (
                  <line
                    x1={c.x + 100}
                    y1={Y_TOP}
                    x2={c.x + 100}
                    y2={Y_BOTTOM + 44}
                    stroke="rgb(var(--border-subtle))"
                    strokeWidth={1}
                    strokeDasharray="4 4"
                  />
                )}
              </g>
            );
          })}

          {/* Legend */}
          <rect x={W - 140} y={Y_TOP + 4} width={14} height={14} fill={aColor} rx={2} />
          <text x={W - 122} y={Y_TOP + 14} fontSize={11} fill="rgb(var(--text-secondary))">
            Treatment A
          </text>
          <rect x={W - 140} y={Y_TOP + 22} width={14} height={14} fill={bColor} rx={2} />
          <text x={W - 122} y={Y_TOP + 32} fontSize={11} fill="rgb(var(--text-secondary))">
            Treatment B
          </text>
        </svg>

        {/* Slider + readout */}
        <div className="border-t border-border-subtle bg-surface p-4">
          <label className="flex items-center gap-4">
            <span className="shrink-0 text-body-sm text-text-secondary">
              Fraction of B&apos;s patients with <strong>mild</strong> cases
            </span>
            <input
              type="range"
              min={0}
              max={1}
              step={0.01}
              value={bMildFrac}
              onChange={(e) => setBMildFrac(parseFloat(e.target.value))}
              className="flex-1 accent-accent-500"
            />
            <span className="w-10 text-right font-mono text-body-sm text-text-primary">
              {Math.round(bMildFrac * 100)}%
            </span>
          </label>

          <div
            className={`mt-3 rounded-md border p-3 text-body-sm transition-colors ${
              paradoxActive
                ? "border-danger bg-danger/5 text-danger"
                : "border-success bg-success/5 text-success"
            }`}
          >
            {paradoxActive ? (
              <>
                <strong>Paradox active.</strong> B overall ({pct(bOverall)}) &gt; A overall (
                {pct(A_OVERALL)}) — yet A beats B in <em>every</em> subgroup. B appears better only
                because it treats proportionally more easy cases.
              </>
            ) : (
              <>
                No paradox. A overall ({pct(A_OVERALL)}) &gt; B overall ({pct(bOverall)}). A wins in
                each subgroup <em>and</em> overall. Slide B&apos;s mild fraction past ~53% to
                trigger the reversal.
              </>
            )}
          </div>
        </div>
      </div>
      <figcaption className="mt-3 max-w-prose text-caption text-text-muted">
        Treatment A has a higher success rate than B in both mild cases (80% vs 70%) and severe
        cases (50% vs 40%). Drag the slider right to give B proportionally more easy cases — watch
        the Overall column flip even though A never stops winning in each individual group.
      </figcaption>
    </figure>
  );
}
