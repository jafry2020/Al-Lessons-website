"use client";

import { Copy } from "lucide-react";
import { useState } from "react";

interface Props {
  language?: string;
  children: string;
}

/**
 * Static, copy-able code block.
 * No execution — per MVP scope decisions.
 */
export function CodeBlock({ language = "code", children }: Props) {
  const [copied, setCopied] = useState(false);

  const copy = async () => {
    try {
      await navigator.clipboard?.writeText(children);
      setCopied(true);
      setTimeout(() => setCopied(false), 1400);
    } catch {
      /* ignore */
    }
  };

  return (
    <div className="my-6 rounded-md overflow-hidden border border-border-subtle bg-surface-raised">
      <div className="flex items-center justify-between px-4 py-2 border-b border-border-subtle">
        <span className="text-overline uppercase text-text-muted">{language}</span>
        <button
          onClick={copy}
          className="inline-flex items-center gap-1.5 text-caption text-text-secondary hover:text-text-primary"
        >
          <Copy size={12} /> {copied ? "Copied" : "Copy"}
        </button>
      </div>
      <pre className="p-4 overflow-x-auto text-body-sm font-mono leading-relaxed text-text-primary">
        <code>{children}</code>
      </pre>
    </div>
  );
}
