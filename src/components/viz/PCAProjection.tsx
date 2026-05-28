"use client";

import { useMemo, useState } from "react";

/**
 * PCA visualisation widget for A3.4.
 *
 * 80 2D points sampled from a tilted ellipse. Computes the principal axes via
 * eigendecomposition of the 2x2 covariance matrix. Shows PC1 and PC2 as arrows
 * from the mean, lengths proportional to standard deviation along each axis.
 *
 * Toggle "Project to PC1" to collapse all points onto the PC1 line and draw
 * residual segments (the reconstruction error).
 */

const W = 640;
const H = 380;
const X_MIN = -3;
const X_MAX = 3;
const Y_MIN = -2.5;
const Y_MAX = 2.5;

const sx = (x: number) => ((x - X_MIN) / (X_MAX - X_MIN)) * W;
const sy = (y: number) => H - ((y - Y_MIN) / (Y_MAX - Y_MIN)) * H;

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
  const rng = mulberry32(73);
  const angle = Math.PI / 6; // 30 degrees tilt
  const cos = Math.cos(angle);
  const sin = Math.sin(angle);
  const pts: { x: number; y: number }[] = [];
  for (let i = 0; i < 80; i += 1) {
    const u = 1.7 * gaussian(rng); // major axis
    const v = 0.5 * gaussian(rng); // minor axis
    pts.push({ x: cos * u - sin * v, y: sin * u + cos * v });
  }
  return pts;
}

/** 2x2 eigendecomposition for the covariance matrix. */
function eigDecomp2x2(
  a: number,
  b: number,
  c: number,
  d: number
): {
  e1: { val: number; vec: { x: number; y: number } };
  e2: { val: number; vec: { x: number; y: number } };
} {
  // Matrix [[a, b], [c, d]] — covariance is symmetric so b == c.
  const trace = a + d;
  const det = a * d - b * c;
  const disc = Math.sqrt(Math.max(0, (trace * trace) / 4 - det));
  const lam1 = trace / 2 + disc;
  const lam2 = trace / 2 - disc;

  // Eigenvector for lam1: solve (a - lam1) x + b y = 0
  let v1x = 1;
  let v1y = 0;
  if (Math.abs(b) > 1e-9) {
    v1x = b;
    v1y = lam1 - a;
  } else if (Math.abs(a - lam1) < 1e-9) {
    v1x = 1;
    v1y = 0;
  } else {
    v1x = 0;
    v1y = 1;
  }
  const n1 = Math.hypot(v1x, v1y) || 1;
  v1x /= n1;
  v1y /= n1;
  // PC2 is perpendicular.
  const v2x = -v1y;
  const v2y = v1x;
  return {
    e1: { val: lam1, vec: { x: v1x, y: v1y } },
    e2: { val: lam2, vec: { x: v2x, y: v2y } },
  };
}

export function PCAProjection() {
  const data = useMemo(() => sampleData(), []);
  const [projectMode, setProjectMode] = useState(false);

  const { mean, e1, e2, var1, var2 } = useMemo(() => {
    const mx = data.reduce((s, p) => s + p.x, 0) / data.length;
    const my = data.reduce((s, p) => s + p.y, 0) / data.length;
    let cxx = 0;
    let cyy = 0;
    let cxy = 0;
    for (const p of data) {
      cxx += (p.x - mx) ** 2;
      cyy += (p.y - my) ** 2;
      cxy += (p.x - mx) * (p.y - my);
    }
    cxx /= data.length;
    cyy /= data.length;
    cxy /= data.length;
    const eig = eigDecomp2x2(cxx, cxy, cxy, cyy);
    return {
      mean: { x: mx, y: my },
      e1: eig.e1.vec,
      e2: eig.e2.vec,
      var1: eig.e1.val,
      var2: eig.e2.val,
    };
  }, [data]);

  const totalVar = var1 + var2;
  const ratio1 = var1 / totalVar;

  // Reconstruction error if we project to PC1 only = sum of squared distances along PC2.
  const reconstructionMSE =
    data.reduce((s, p) => {
      const dx = p.x - mean.x;
      const dy = p.y - mean.y;
      const along2 = dx * e2.x + dy * e2.y;
      return s + along2 ** 2;
    }, 0) / data.length;

  // Arrow tips: from mean to mean + sqrt(eigenvalue) * eigenvector (1.5 std away).
  const scaleArrow = 1.5;
  const arrow1End = {
    x: mean.x + scaleArrow * Math.sqrt(var1) * e1.x,
    y: mean.y + scaleArrow * Math.sqrt(var1) * e1.y,
  };
  const arrow2End = {
    x: mean.x + scaleArrow * Math.sqrt(var2) * e2.x,
    y: mean.y + scaleArrow * Math.sqrt(var2) * e2.y,
  };

  // PC1 line: extends through the data in both directions.
  const lineExt = 3;
  const lineA = {
    x: mean.x - lineExt * e1.x,
    y: mean.y - lineExt * e1.y,
  };
  const lineB = {
    x: mean.x + lineExt * e1.x,
    y: mean.y + lineExt * e1.y,
  };

  // Projected points onto PC1 line.
  const projectedPts = data.map((p) => {
    const dx = p.x - mean.x;
    const dy = p.y - mean.y;
    const along = dx * e1.x + dy * e1.y;
    return { x: mean.x + along * e1.x, y: mean.y + along * e1.y };
  });

  return (
    <figure className="my-10">
      <div className="overflow-hidden rounded-lg border border-border-subtle bg-surface-raised shadow-md">
        <svg viewBox={`0 0 ${W} ${H}`} className="block h-auto w-full">
          <line
            x1={0}
            y1={sy(0)}
            x2={W}
            y2={sy(0)}
            stroke="rgb(var(--border-subtle))"
            strokeWidth={1}
          />
          <line
            x1={sx(0)}
            y1={0}
            x2={sx(0)}
            y2={H}
            stroke="rgb(var(--border-subtle))"
            strokeWidth={1}
          />

          {/* PC1 line */}
          <line
            x1={sx(lineA.x)}
            y1={sy(lineA.y)}
            x2={sx(lineB.x)}
            y2={sy(lineB.y)}
            stroke="rgb(var(--viz-2))"
            strokeWidth={2}
            strokeDasharray={projectMode ? undefined : "4 4"}
            opacity={0.7}
          />

          {/* Residual segments in project mode */}
          {projectMode &&
            data.map((p, i) => (
              <line
                key={`r-${i}`}
                x1={sx(p.x)}
                y1={sy(p.y)}
                x2={sx(projectedPts[i].x)}
                y2={sy(projectedPts[i].y)}
                stroke="rgb(var(--warning))"
                strokeOpacity={0.4}
                strokeWidth={1}
              />
            ))}

          {/* Original points */}
          {data.map((p, i) => (
            <circle
              key={`pt-${i}`}
              cx={sx(p.x)}
              cy={sy(p.y)}
              r={3.5}
              fill="rgb(var(--accent-500))"
              opacity={projectMode ? 0.35 : 0.85}
            />
          ))}

          {/* Projected points */}
          {projectMode &&
            projectedPts.map((p, i) => (
              <circle key={`proj-${i}`} cx={sx(p.x)} cy={sy(p.y)} r={4} fill="rgb(var(--viz-2))" />
            ))}

          {/* PC1 arrow */}
          <line
            x1={sx(mean.x)}
            y1={sy(mean.y)}
            x2={sx(arrow1End.x)}
            y2={sy(arrow1End.y)}
            stroke="rgb(var(--viz-2))"
            strokeWidth={3}
          />
          <circle cx={sx(arrow1End.x)} cy={sy(arrow1End.y)} r={5} fill="rgb(var(--viz-2))" />
          <text
            x={sx(arrow1End.x) + 8}
            y={sy(arrow1End.y) - 4}
            fontSize={12}
            fontWeight={600}
            fill="rgb(var(--viz-2))"
          >
            PC1
          </text>

          {/* PC2 arrow */}
          <line
            x1={sx(mean.x)}
            y1={sy(mean.y)}
            x2={sx(arrow2End.x)}
            y2={sy(arrow2End.y)}
            stroke="rgb(var(--viz-3))"
            strokeWidth={3}
          />
          <circle cx={sx(arrow2End.x)} cy={sy(arrow2End.y)} r={5} fill="rgb(var(--viz-3))" />
          <text
            x={sx(arrow2End.x) + 8}
            y={sy(arrow2End.y) - 4}
            fontSize={12}
            fontWeight={600}
            fill="rgb(var(--viz-3))"
          >
            PC2
          </text>

          {/* Mean marker */}
          <circle cx={sx(mean.x)} cy={sy(mean.y)} r={4} fill="rgb(var(--text-primary))" />
        </svg>

        <div className="border-t border-border-subtle bg-surface p-4">
          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={() => setProjectMode(!projectMode)}
              className="rounded-sm border border-accent-500 bg-accent-500/10 px-4 py-1.5 text-body-sm text-accent-500"
            >
              {projectMode ? "Show original points" : "Project to PC1"}
            </button>
          </div>

          <div className="mt-4 grid grid-cols-2 gap-4 sm:grid-cols-3">
            <Metric label="Var along PC1" value={var1} />
            <Metric label="Var along PC2" value={var2} />
            <Metric label="PC1 explained" value={ratio1 * 100} suffix="%" />
          </div>

          {projectMode && (
            <p className="mt-3 text-body-sm text-text-secondary">
              Reconstruction MSE (lost variance along PC2):{" "}
              <span className="font-mono text-warning">{reconstructionMSE.toFixed(3)}</span>. This
              is exactly equal to the eigenvalue of PC2 ({var2.toFixed(3)}). Trading PC2 for a 1D
              representation is the PCA compression decision.
            </p>
          )}
        </div>
      </div>
      <figcaption className="mt-3 max-w-prose text-caption text-text-muted">
        Arrows show the two principal components from the mean, with length proportional to standard
        deviation along each axis. PC1 captures the bulk of the variance; projecting retains it and
        discards PC2 (the reconstruction error).
      </figcaption>
    </figure>
  );
}

function Metric({ label, value, suffix = "" }: { label: string; value: number; suffix?: string }) {
  return (
    <div className="rounded-sm border border-border-subtle bg-canvas p-3">
      <div className="text-overline uppercase text-text-muted">{label}</div>
      <div className="mt-1 font-mono text-h4 text-accent-500">
        {value.toFixed(2)}
        {suffix}
      </div>
    </div>
  );
}
