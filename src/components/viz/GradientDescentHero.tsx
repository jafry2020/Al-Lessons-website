"use client";

import { useEffect, useRef, useState } from "react";

// A live, looping gradient-descent demo on a bowl-shaped loss surface.
// Contour lines + a ball that descends, restarts from a new random point.

const W = 560;
const H = 360;

// Loss surface: f(x, y) = 0.5 * (1.2 * x^2 + y^2) (an elongated bowl).
// Only the gradient is needed at runtime; the loss itself is implicit in the
// contour ellipses computed inline below.
function grad(x: number, y: number) {
  return [1.2 * x, y] as const;
}

// Map data coords [-3..3] → svg coords
const toX = (x: number) => ((x + 3) / 6) * W;
const toY = (y: number) => ((y + 3) / 6) * H;

export function GradientDescentHero() {
  const [path, setPath] = useState<{ x: number; y: number }[]>([{ x: 2.4, y: -2.2 }]);
  const lr = 0.12;
  const raf = useRef<number>(0);

  useEffect(() => {
    let last = 0;
    const tick = (t: number) => {
      if (t - last > 90) {
        last = t;
        setPath((p) => {
          const head = p[p.length - 1];
          if ((Math.abs(head.x) < 0.05 && Math.abs(head.y) < 0.05) || p.length > 60) {
            const angle = Math.random() * Math.PI * 2;
            const r = 2 + Math.random() * 0.6;
            return [{ x: Math.cos(angle) * r, y: Math.sin(angle) * r }];
          }
          const [gx, gy] = grad(head.x, head.y);
          return [...p, { x: head.x - lr * gx, y: head.y - lr * gy }];
        });
      }
      raf.current = requestAnimationFrame(tick);
    };
    raf.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf.current);
  }, []);

  // Pre-compute contour ellipses
  const contours = [0.5, 1.2, 2.2, 3.4, 4.8];

  return (
    <div className="relative w-full max-w-[560px]">
      <svg
        viewBox={`0 0 ${W} ${H}`}
        className="h-auto w-full rounded-lg border border-border-subtle bg-surface-raised shadow-md"
        aria-label="Gradient descent demonstration"
      >
        <defs>
          <radialGradient id="bowl" cx="50%" cy="50%" r="60%">
            <stop offset="0%" stopColor="rgb(var(--accent-500) / 0.18)" />
            <stop offset="100%" stopColor="rgb(var(--accent-500) / 0)" />
          </radialGradient>
        </defs>

        <rect width={W} height={H} fill="url(#bowl)" />

        {contours.map((c, i) => {
          const rx = Math.sqrt((2 * c) / 1.2) * (W / 6);
          const ry = Math.sqrt(2 * c) * (H / 6);
          return (
            <ellipse
              key={i}
              cx={W / 2}
              cy={H / 2}
              rx={rx}
              ry={ry}
              fill="none"
              stroke="rgb(var(--accent-500) / 0.35)"
              strokeWidth={0.8}
              strokeDasharray="2 3"
            />
          );
        })}

        {/* Path */}
        <polyline
          points={path.map((p) => `${toX(p.x)},${toY(p.y)}`).join(" ")}
          fill="none"
          stroke="rgb(var(--accent-500))"
          strokeWidth={2}
          strokeLinecap="round"
          strokeLinejoin="round"
        />

        {/* Trailing dots */}
        {path.map((p, i) => (
          <circle
            key={i}
            cx={toX(p.x)}
            cy={toY(p.y)}
            r={i === path.length - 1 ? 6 : 2}
            fill={i === path.length - 1 ? "rgb(var(--accent-500))" : "rgb(var(--accent-500) / 0.4)"}
          />
        ))}

        {/* Center marker = minimum */}
        <g>
          <circle cx={W / 2} cy={H / 2} r={3} fill="rgb(var(--text-primary))" />
          <text
            x={W / 2 + 8}
            y={H / 2 + 4}
            fontSize="11"
            fill="rgb(var(--text-secondary))"
            fontFamily="JetBrains Mono, monospace"
          >
            minimum
          </text>
        </g>
      </svg>
    </div>
  );
}
