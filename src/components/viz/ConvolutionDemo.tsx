"use client";

import { useMemo, useState } from "react";

/**
 * Convolution demo for A5.1.
 *
 * 8x8 input grid, 3x3 kernel selectable from presets (edge, blur, identity,
 * sharpen). User scrolls position; the widget shows the kernel overlay on the
 * input, the dot product, and the full output grid with current position
 * highlighted.
 */

const INPUT_SIZE = 8;
const KERNEL_SIZE = 3;
const OUTPUT_SIZE = INPUT_SIZE - KERNEL_SIZE + 1;
const CELL = 36;

type KernelKey = "edge" | "blur" | "identity" | "sharpen";

const KERNELS: Record<KernelKey, { label: string; kernel: number[][]; description: string }> = {
  identity: {
    label: "Identity",
    kernel: [
      [0, 0, 0],
      [0, 1, 0],
      [0, 0, 0],
    ],
    description: "Pass-through: output = centre input pixel. No transformation.",
  },
  edge: {
    label: "Edge (Sobel-x)",
    kernel: [
      [-1, 0, 1],
      [-2, 0, 2],
      [-1, 0, 1],
    ],
    description:
      "Detects vertical edges by computing the horizontal gradient. Large positive output where the input transitions left-to-right.",
  },
  blur: {
    label: "Blur (Gaussian)",
    kernel: [
      [1, 2, 1],
      [2, 4, 2],
      [1, 2, 1],
    ],
    description: "Smooths the image by averaging each pixel with its neighbours (weighted).",
  },
  sharpen: {
    label: "Sharpen",
    kernel: [
      [0, -1, 0],
      [-1, 5, -1],
      [0, -1, 0],
    ],
    description: "Enhances edges by subtracting smoothed version from the original.",
  },
};

// A small input image with a clear vertical edge in the middle.
const INPUT: number[][] = [
  [50, 50, 50, 200, 200, 200, 200, 200],
  [50, 50, 50, 200, 200, 200, 200, 200],
  [50, 50, 50, 200, 200, 200, 200, 200],
  [50, 50, 50, 200, 200, 200, 200, 200],
  [50, 50, 50, 200, 200, 200, 200, 200],
  [50, 50, 80, 200, 200, 200, 200, 200],
  [50, 50, 80, 200, 200, 200, 200, 200],
  [50, 50, 50, 200, 200, 200, 200, 200],
];

function convolve(input: number[][], kernel: number[][]): number[][] {
  const out: number[][] = [];
  for (let i = 0; i <= INPUT_SIZE - KERNEL_SIZE; i += 1) {
    const row: number[] = [];
    for (let j = 0; j <= INPUT_SIZE - KERNEL_SIZE; j += 1) {
      let s = 0;
      for (let ki = 0; ki < KERNEL_SIZE; ki += 1) {
        for (let kj = 0; kj < KERNEL_SIZE; kj += 1) {
          s += kernel[ki][kj] * input[i + ki][j + kj];
        }
      }
      row.push(s);
    }
    out.push(row);
  }
  return out;
}

export function ConvolutionDemo() {
  const [activeKey, setActiveKey] = useState<KernelKey>("edge");
  const [pos, setPos] = useState({ r: 2, c: 2 });

  const cfg = KERNELS[activeKey];
  const output = useMemo(() => convolve(INPUT, cfg.kernel), [cfg]);

  const maxOut = Math.max(...output.flat().map(Math.abs));
  const minOut = Math.min(...output.flat());
  const maxIn = Math.max(...INPUT.flat());

  const currentValue = output[pos.r][pos.c];

  // Compute the dot product display for current position
  const dotProductPairs: { input: number; kernel: number; product: number }[] = [];
  for (let ki = 0; ki < KERNEL_SIZE; ki += 1) {
    for (let kj = 0; kj < KERNEL_SIZE; kj += 1) {
      const inp = INPUT[pos.r + ki][pos.c + kj];
      const k = cfg.kernel[ki][kj];
      dotProductPairs.push({ input: inp, kernel: k, product: inp * k });
    }
  }

  const renderCell = (value: number, highlight: boolean, isKernel = false, maxVal = 255) => {
    const intensity = isKernel
      ? value === 0
        ? 0
        : Math.abs(value) / Math.max(1, Math.max(...cfg.kernel.flat().map(Math.abs)))
      : value / maxVal;
    const bg = isKernel
      ? value === 0
        ? "rgb(var(--border-subtle))"
        : value > 0
          ? `rgba(46, 184, 138, ${intensity})`
          : `rgba(212, 78, 60, ${intensity})`
      : `rgb(${Math.round(intensity * 200) + 30}, ${Math.round(intensity * 200) + 30}, ${Math.round(intensity * 200) + 30})`;

    return {
      backgroundColor: bg,
      border: highlight
        ? "2px solid rgb(var(--accent-500))"
        : "1px solid rgb(var(--border-subtle))",
    };
  };

  return (
    <figure className="my-10">
      <div className="overflow-hidden rounded-lg border border-border-subtle bg-surface-raised shadow-md">
        <div className="flex flex-wrap gap-2 border-b border-border-subtle bg-surface p-3">
          {(Object.keys(KERNELS) as KernelKey[]).map((k) => (
            <button
              key={k}
              onClick={() => setActiveKey(k)}
              className={`rounded-sm border px-3 py-1 text-body-sm ${
                k === activeKey
                  ? "border-accent-500 bg-accent-500/10 text-accent-500"
                  : "border-border-subtle text-text-secondary"
              }`}
            >
              {KERNELS[k].label}
            </button>
          ))}
        </div>

        <div className="grid gap-6 p-4 md:grid-cols-3">
          {/* Input */}
          <div>
            <div className="mb-2 text-overline uppercase text-text-muted">Input (8 × 8)</div>
            <div
              className="inline-block"
              style={{ display: "grid", gridTemplateColumns: `repeat(${INPUT_SIZE}, ${CELL}px)` }}
            >
              {INPUT.flatMap((row, i) =>
                row.map((v, j) => {
                  const inWindow =
                    i >= pos.r && i < pos.r + KERNEL_SIZE && j >= pos.c && j < pos.c + KERNEL_SIZE;
                  return (
                    <div
                      key={`in-${i}-${j}`}
                      style={{
                        width: CELL,
                        height: CELL,
                        ...renderCell(v, inWindow, false, maxIn),
                      }}
                      className="flex items-center justify-center font-mono text-[10px]"
                    >
                      <span style={{ color: v > 120 ? "black" : "white" }}>{v}</span>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* Kernel */}
          <div>
            <div className="mb-2 text-overline uppercase text-text-muted">Kernel (3 × 3)</div>
            <div
              className="inline-block"
              style={{ display: "grid", gridTemplateColumns: `repeat(${KERNEL_SIZE}, ${CELL}px)` }}
            >
              {cfg.kernel.flatMap((row, i) =>
                row.map((v, j) => (
                  <div
                    key={`k-${i}-${j}`}
                    style={{
                      width: CELL,
                      height: CELL,
                      ...renderCell(v, false, true),
                    }}
                    className="flex items-center justify-center font-mono text-[12px] text-text-primary"
                  >
                    {v}
                  </div>
                ))
              )}
            </div>
            <div className="mt-3 rounded-sm border border-border-subtle bg-canvas p-3">
              <div className="text-overline uppercase text-text-muted">Dot product</div>
              <div className="mt-1 font-mono text-body-sm text-text-secondary">
                Σ (input × kernel) = <span className="text-h4 text-accent-500">{currentValue}</span>
              </div>
            </div>
          </div>

          {/* Output */}
          <div>
            <div className="mb-2 text-overline uppercase text-text-muted">
              Output ({OUTPUT_SIZE} × {OUTPUT_SIZE})
            </div>
            <div
              className="inline-block"
              style={{ display: "grid", gridTemplateColumns: `repeat(${OUTPUT_SIZE}, ${CELL}px)` }}
            >
              {output.flatMap((row, i) =>
                row.map((v, j) => {
                  const isPos = i === pos.r && j === pos.c;
                  const normalised = (v - minOut) / Math.max(1, maxOut - minOut);
                  return (
                    <div
                      key={`out-${i}-${j}`}
                      style={{
                        width: CELL,
                        height: CELL,
                        backgroundColor: `rgb(${Math.round(normalised * 200) + 30}, ${Math.round(normalised * 200) + 30}, ${Math.round(normalised * 200) + 30})`,
                        border: isPos
                          ? "2px solid rgb(var(--accent-500))"
                          : "1px solid rgb(var(--border-subtle))",
                        cursor: "pointer",
                      }}
                      className="flex items-center justify-center font-mono text-[10px]"
                      onClick={() => setPos({ r: i, c: j })}
                    >
                      <span style={{ color: normalised > 0.5 ? "black" : "white" }}>{v}</span>
                    </div>
                  );
                })
              )}
            </div>
            <p className="mt-2 text-caption text-text-muted">
              Click any output cell to slide the kernel there.
            </p>
          </div>
        </div>

        <div className="border-t border-border-subtle bg-surface p-4">
          <p className="text-body-sm text-text-secondary">{cfg.description}</p>
        </div>
      </div>
      <figcaption className="mt-3 max-w-prose text-caption text-text-muted">
        The kernel slides across the input; at each position, the dot product becomes one output
        pixel. Different kernels detect different image features — edges, blurs, sharpenings. In a
        real CNN, these kernels are learned, not hand-designed.
      </figcaption>
    </figure>
  );
}
