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
        className="border-b border-dashed border-border-strong text-text-primary transition-colors hover:border-accent-500 hover:text-accent-500"
      >
        {children ?? term}
      </button>
      {open && (
        <span
          role="tooltip"
          className="absolute left-0 top-full z-30 mt-2 w-80 animate-fadeUp rounded-md border border-border-subtle bg-surface-raised p-4 text-left shadow-lg"
        >
          <span className="mb-1 block text-h4 font-semibold">{term}</span>
          <span className="block text-body-sm leading-relaxed text-text-secondary">
            {definition}
          </span>
          <span className="mt-3 block border-t border-border-subtle pt-3">
            <a href="#" className="text-body-sm text-accent-500 hover:underline">
              Open in glossary →
            </a>
          </span>
        </span>
      )}
    </span>
  );
}
