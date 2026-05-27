"use client";

import { useState, useRef, useEffect } from "react";

interface Props {
  term: string;
  definition: string;
  children?: React.ReactNode;
}

export function GlossaryTerm({ term, definition, children }: Props) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open]);

  return (
    <span ref={ref} className="relative inline-block">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        onMouseEnter={() => setOpen(true)}
        className="border-b border-dashed border-border-strong text-text-primary hover:text-accent-500 hover:border-accent-500 transition-colors"
      >
        {children ?? term}
      </button>
      {open && (
        <span
          role="tooltip"
          className="absolute left-0 top-full mt-2 z-30 w-80 p-4 bg-surface-raised border border-border-subtle rounded-md shadow-lg animate-fadeUp text-left"
        >
          <span className="block text-h4 font-semibold mb-1">{term}</span>
          <span className="block text-body-sm text-text-secondary leading-relaxed">
            {definition}
          </span>
          <span className="block mt-3 pt-3 border-t border-border-subtle">
            <a href="#" className="text-body-sm text-accent-500 hover:underline">
              Open in glossary →
            </a>
          </span>
        </span>
      )}
    </span>
  );
}
