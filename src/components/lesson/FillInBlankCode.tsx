"use client";

import { useState } from "react";
import { cn } from "@/lib/cn";
import { Check, X } from "lucide-react";
import { HintLadder } from "./HintLadder";

interface Props {
  prompt: string;
  before: string;
  after: string;
  expected: string[]; // any accepted answer
  hints: string[];
  solution: string;
}

export function FillInBlankCode({ prompt, before, after, expected, hints, solution }: Props) {
  const [value, setValue] = useState("");
  const [submitted, setSubmitted] = useState(false);

  const normalize = (s: string) => s.trim().replace(/\s+/g, " ").toLowerCase();
  const correct = submitted && expected.some((e) => normalize(e) === normalize(value));

  return (
    <div className="my-8 rounded-md border border-border-subtle bg-surface p-6">
      <div className="mb-2 text-overline uppercase text-text-secondary">Code challenge</div>
      <p className="mb-4 text-body-lg">{prompt}</p>

      <div className="overflow-x-auto rounded-sm border border-border-subtle bg-surface-raised p-4 font-mono text-body-sm">
        <pre className="whitespace-pre text-text-primary">{before}</pre>
        <div className="my-1 flex items-center gap-2">
          <input
            value={value}
            onChange={(e) => setValue(e.target.value)}
            placeholder="your answer"
            spellCheck={false}
            className={cn(
              "w-72 max-w-full rounded-sm border border-border-strong bg-canvas px-3 py-1.5 font-mono text-body-sm text-accent-600",
              submitted && correct && "border-success bg-success/10",
              submitted && !correct && "border-danger bg-danger/10"
            )}
          />
          {submitted &&
            (correct ? (
              <Check size={16} className="text-success" />
            ) : (
              <X size={16} className="text-danger" />
            ))}
        </div>
        <pre className="whitespace-pre text-text-primary">{after}</pre>
      </div>

      <div className="mt-4 flex gap-2">
        <button
          onClick={() => setSubmitted(true)}
          disabled={!value}
          className="h-9 rounded-sm bg-accent-500 px-4 text-body-sm font-medium text-white hover:bg-accent-600 disabled:opacity-50"
        >
          Check answer
        </button>
        {submitted && (
          <button
            onClick={() => {
              setSubmitted(false);
              setValue("");
            }}
            className="h-9 rounded-sm border border-border-strong px-4 text-body-sm font-medium hover:bg-subtle"
          >
            Try again
          </button>
        )}
      </div>

      <HintLadder hints={hints} solution={solution} />
    </div>
  );
}
