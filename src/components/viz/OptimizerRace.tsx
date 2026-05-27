"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Play, Pause, RotateCcw } from "lucide-react";
import { cn } from "@/lib/cn";

/**
 * Optimizer Race
 * Compare SGD, Momentum, RMSprop, Adam on the Beale-like surface:
 *   f(x, y) = (1.5 - x + x*y)^2 + (2.25 - x + x*y^2)^2 + (2.625 - x + x*y^3)^2
 * scaled and clipped to fit in [-4, 4]^2 around its minimum at (3, 0.5).
 * For the visualization we center coordinates so the minimum sits in view.
 */

const W = 760;
const H = 460;
const X_MIN = -1.5;
const X_MAX = 4.5;
const Y_MIN = -1.5;
const Y_MAX = 2.5;

function beale(x: number, y: number) {
  const a = 1.5 - x + x * y;
  const b = 2.25 - x + x * y * y;
  const c = 2.625 - x + x * y * y * y;
  return a * a + b * b + c * c;
}

function bealeGrad(x: number, y: number) {
  const a = 1.5 - x + x * y;
  const b = 2.25 - x + x * y * y;
  const c = 2.625 - x + x * y * y * y;
  const dx = 2 * a * (-1 + y) + 2 * b * (-1 + y * y) + 2 * c * (-1 + y * y * y);
  const dy = 2 * a * x + 2 * b * (2 * x * y) + 2 * c * (3 * x * y * y);
  return [dx, dy] as const;
}

const toScreenX = (x: number) => ((x - X_MIN) / (X_MAX - X_MIN)) * W;
const toScreenY = (y: number) => H - ((y - Y_MIN) / (Y_MAX - Y_MIN)) * H;

type Optimizer = "sgd" | "momentum" | "rmsprop" | "adam";

interface OptimizerConfig {
  key: Optimizer;
  label: string;
  description: string;
  varKey: string;
}

const OPTIMIZERS: OptimizerConfig[] = [
  { key: "sgd", label: "SGD", description: "Pure gradient descent.", varKey: "viz-7" },
  { key: "momentum", label: "Momentum", description: "Velocity smooths the path.", varKey: "viz-3" },
  { key: "rmsprop", label: "RMSprop", description: "Per-parameter adaptive step.", varKey: "viz-2" },
  { key: "adam", label: "Adam", description: "Momentum + adaptive — the default.", varKey: "viz-1" },
];

interface Trajectory {
  pts: { x: number; y: number; loss: number }[];
  state: Record<string, number>;
  finished: boolean;
}

function initState(opt: Optimizer): Record<string, number> {
  switch (opt) {
    case "sgd":
      return {};
    case "momentum":
      return { vx: 0, vy: 0 };
    case "rmsprop":
      return { sx: 0, sy: 0 };
    case "adam":
      return { mx: 0, my: 0, vx: 0, vy: 0, t: 0 };
  }
}

function step(
  opt: Optimizer,
  s: Record<string, number>,
  x: number,
  y: number,
  lr: number
): [number, number, Record<string, number>] {
  const [gx, gy] = bealeGrad(x, y);
  // Gradient clipping to keep visualization tame
  const clip = (g: number) => Math.max(-5, Math.min(5, g));
  const cgx = clip(gx);
  const cgy = clip(gy);

  switch (opt) {
    case "sgd": {
      return [x - lr * cgx, y - lr * cgy, s];
    }
    case "momentum": {
      const beta = 0.9;
      const vx = beta * s.vx + cgx;
      const vy = beta * s.vy + cgy;
      return [x - lr * vx, y - lr * vy, { vx, vy }];
    }
    case "rmsprop": {
      const rho = 0.9;
      const eps = 1e-6;
      const sx = rho * s.sx + (1 - rho) * cgx * cgx;
      const sy = rho * s.sy + (1 - rho) * cgy * cgy;
      return [
        x - (lr * cgx) / Math.sqrt(sx + eps),
        y - (lr * cgy) / Math.sqrt(sy + eps),
        { sx, sy },
      ];
    }
    case "adam": {
      const b1 = 0.9;
      const b2 = 0.999;
      const eps = 1e-8;
      const t = s.t + 1;
      const mx = b1 * s.mx + (1 - b1) * cgx;
      const my = b1 * s.my + (1 - b1) * cgy;
      const vx = b2 * s.vx + (1 - b2) * cgx * cgx;
      const vy = b2 * s.vy + (1 - b2) * cgy * cgy;
      const mxh = mx / (1 - Math.pow(b1, t));
      const myh = my / (1 - Math.pow(b1, t));
      const vxh = vx / (1 - Math.pow(b2, t));
      const vyh = vy / (1 - Math.pow(b2, t));
      return [
        x - (lr * mxh) / (Math.sqrt(vxh) + eps),
        y - (lr * myh) / (Math.sqrt(vyh) + eps),
        { mx, my, vx, vy, t },
      ];
    }
  }
}

const DEFAULT_START = { x: -0.5, y: 1.8 };

export function OptimizerRace() {
  const [start, setStart] = useState(DEFAULT_START);
  const [lr, setLr] = useState(0.02);
  const [enabled, setEnabled] = useState<Record<Optimizer, boolean>>({
    sgd: true,
    momentum: true,
    rmsprop: true,
    adam: true,
  });
  const [playing, setPlaying] = useState(true);
  const [tick, setTick] = useState(0);

  const trajRef = useRef<Record<Optimizer, Trajectory>>(initTrajectories(start));
  const raf = useRef<number>(0);

  function initTrajectories(s: { x: number; y: number }) {
    const out = {} as Record<Optimizer, Trajectory>;
    OPTIMIZERS.forEach((o) => {
      out[o.key] = {
        pts: [{ x: s.x, y: s.y, loss: beale(s.x, s.y) }],
        state: initState(o.key),
        finished: false,
      };
    });
    return out;
  }

  // Reset trajectories when start changes
  useEffect(() => {
    trajRef.current = initTrajectories(start);
    setTick((t) => t + 1);
  }, [start]);

  // Animation loop
  useEffect(() => {
    if (!playing) return;
    let last = 0;
    const loop = (t: number) => {
      if (t - last > 60) {
        last = t;
        let anyAlive = false;
        OPTIMIZERS.forEach((o) => {
          if (!enabled[o.key]) return;
          const tr = trajRef.current[o.key];
          if (tr.finished || tr.pts.length > 400) {
            tr.finished = true;
            return;
          }
          const head = tr.pts[tr.pts.length - 1];
          const [nx, ny, ns] = step(o.key, tr.state, head.x, head.y, lr);
          if (
            !Number.isFinite(nx) ||
            !Number.isFinite(ny) ||
            nx < X_MIN ||
            nx > X_MAX ||
            ny < Y_MIN ||
            ny > Y_MAX
          ) {
            tr.finished = true;
            return;
          }
          const l = beale(nx, ny);
          tr.pts.push({ x: nx, y: ny, loss: l });
          tr.state = ns;
          // Near-minimum check
          if (Math.hypot(nx - 3, ny - 0.5) < 0.05) tr.finished = true;
          anyAlive = true;
        });
        setTick((t) => t + 1);
        if (!anyAlive) {
          // Auto-pause when all done
          setPlaying(false);
          return;
        }
      }
      raf.current = requestAnimationFrame(loop);
    };
    raf.current = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf.current);
  }, [playing, enabled, lr]);

  const reset = () => {
    trajRef.current = initTrajectories(start);
    setPlaying(true);
  };

  // Contour grid for backdrop
  const contours = useMemo(() => {
    const grid: { x: number; y: number; loss: number }[] = [];
    const STEP = 18;
    for (let i = 0; i <= W; i += STEP) {
      for (let j = 0; j <= H; j += STEP) {
        const x = X_MIN + (i / W) * (X_MAX - X_MIN);
        const y = Y_MIN + ((H - j) / H) * (Y_MAX - Y_MIN);
        grid.push({ x: i, y: j, loss: beale(x, y) });
      }
    }
    const maxL = Math.log1p(80);
    return grid.map((g) => ({
      ...g,
      intensity: Math.min(1, Math.log1p(g.loss) / maxL),
    }));
  }, []);

  const onSurfaceClick = (e: React.MouseEvent<SVGSVGElement>) => {
    const rect = (e.currentTarget as SVGSVGElement).getBoundingClientRect();
    const px = ((e.clientX - rect.left) / rect.width) * W;
    const py = ((e.clientY - rect.top) / rect.height) * H;
    const x = X_MIN + (px / W) * (X_MAX - X_MIN);
    const y = Y_MIN + ((H - py) / H) * (Y_MAX - Y_MIN);
    setStart({ x, y });
  };

  return (
    <figure className="my-10">
      <div className="rounded-lg border border-border-subtle bg-surface-raised overflow-hidden shadow-md">
        <svg
          viewBox={`0 0 ${W} ${H}`}
          className="w-full h-auto cursor-crosshair"
          onClick={onSurfaceClick}
          aria-label="Optimizer race on a 2D loss surface"
        >
          {/* Loss heatmap */}
          {contours.map((c, i) => (
            <rect
              key={i}
              x={c.x - 9}
              y={c.y - 9}
              width={18}
              height={18}
              fill={`rgb(var(--accent-500) / ${0.08 + c.intensity * 0.25})`}
            />
          ))}

          {/* Axes */}
          <line x1={0} y1={toScreenY(0)} x2={W} y2={toScreenY(0)} stroke="rgb(var(--border-subtle))" strokeWidth={1} />
          <line x1={toScreenX(0)} y1={0} x2={toScreenX(0)} y2={H} stroke="rgb(var(--border-subtle))" strokeWidth={1} />

          {/* Trajectories */}
          {OPTIMIZERS.map((o) => {
            if (!enabled[o.key]) return null;
            const tr = trajRef.current[o.key];
            if (!tr || tr.pts.length < 2) return null;
            const d = tr.pts
              .map((p, i) => `${i === 0 ? "M" : "L"} ${toScreenX(p.x)} ${toScreenY(p.y)}`)
              .join(" ");
            const head = tr.pts[tr.pts.length - 1];
            return (
              <g key={o.key}>
                <path
                  d={d}
                  fill="none"
                  stroke={`rgb(var(--${o.varKey}))`}
                  strokeWidth={2.5}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  opacity={0.9}
                />
                <circle
                  cx={toScreenX(head.x)}
                  cy={toScreenY(head.y)}
                  r={6}
                  fill={`rgb(var(--${o.varKey}))`}
                  stroke="rgb(var(--bg-surface-raised))"
                  strokeWidth={2}
                />
              </g>
            );
          })}

          {/* Start marker */}
          <g>
            <circle cx={toScreenX(start.x)} cy={toScreenY(start.y)} r={4} fill="none" stroke="rgb(var(--text-primary))" strokeWidth={1.5} />
            <text x={toScreenX(start.x) + 8} y={toScreenY(start.y) - 8} fontSize="11" fill="rgb(var(--text-secondary))" fontFamily="JetBrains Mono, monospace">
              start
            </text>
          </g>

          {/* Minimum marker */}
          <g>
            <circle cx={toScreenX(3)} cy={toScreenY(0.5)} r={5} fill="rgb(var(--success))" />
            <text x={toScreenX(3) + 10} y={toScreenY(0.5) + 4} fontSize="11" fill="rgb(var(--text-secondary))" fontFamily="JetBrains Mono, monospace">
              minimum (3, 0.5)
            </text>
          </g>
        </svg>

        {/* Controls */}
        <div className="border-t border-border-subtle p-4 bg-surface">
          <div className="flex flex-wrap items-center gap-4 mb-4">
            <button
              onClick={() => setPlaying((p) => !p)}
              className="h-9 px-3 text-body-sm font-medium rounded-sm bg-accent-500 text-white hover:bg-accent-600 inline-flex items-center gap-2"
            >
              {playing ? <Pause size={14} /> : <Play size={14} />}
              {playing ? "Pause" : "Play"}
            </button>
            <button
              onClick={reset}
              className="h-9 px-3 text-body-sm font-medium rounded-sm border border-border-strong hover:bg-subtle inline-flex items-center gap-2"
            >
              <RotateCcw size={14} /> Reset
            </button>

            <label className="flex items-center gap-3 text-body-sm text-text-secondary">
              <span className="text-overline uppercase text-text-muted">Learning rate</span>
              <input
                type="range"
                min={0.001}
                max={0.05}
                step={0.001}
                value={lr}
                onChange={(e) => {
                  setLr(parseFloat(e.target.value));
                  reset();
                }}
                className="w-40 accent-accent-500"
              />
              <span className="font-mono text-text-primary w-12">{lr.toFixed(3)}</span>
            </label>

            <div className="text-caption text-text-muted">
              Click the surface to set a new start point.
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            {OPTIMIZERS.map((o) => (
              <button
                key={o.key}
                onClick={() => setEnabled({ ...enabled, [o.key]: !enabled[o.key] })}
                className={cn(
                  "px-3 h-9 rounded-sm text-body-sm font-medium inline-flex items-center gap-2 border transition-colors",
                  enabled[o.key]
                    ? "border-border-strong bg-surface text-text-primary"
                    : "border-border-subtle bg-subtle text-text-muted line-through"
                )}
              >
                <span
                  className="w-2.5 h-2.5 rounded-full"
                  style={{ background: `rgb(var(--${o.varKey}))` }}
                />
                {o.label}
                <span className="text-text-muted font-normal text-caption">
                  · {trajRef.current[o.key]?.pts.length ?? 0} steps
                </span>
              </button>
            ))}
          </div>
        </div>
      </div>
      <figcaption className="text-caption text-text-muted mt-3 max-w-prose">
        Beale function (a classic optimizer benchmark). The minimum sits in a narrow,
        curving valley — exactly the kind of loss landscape that exposes which optimizer
        keeps its footing.
      </figcaption>
    </figure>
  );
}
