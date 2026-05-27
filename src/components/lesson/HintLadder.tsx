"use client";

import { useState } from "react";
import { Lightbulb, KeyRound } from "lucide-react";
import { Button } from "@/components/ui/Button";

interface Props {
  hints: string[];
  solution: string;
}

export function HintLadder({ hints, solution }: Props) {
  const [tier, setTier] = useState(0);
  const [showSolution, setShowSolution] = useState(false);

  return (
    <div className="mt-4 space-y-2">
      {hints.slice(0, tier).map((h, i) => (
        <div
          key={i}
          className="flex animate-fadeUp gap-3 rounded-sm border border-border-subtle bg-subtle p-3"
        >
          <Lightbulb size={16} className="mt-0.5 shrink-0 text-warning" />
          <div className="text-body-sm text-text-secondary">
            <span className="mr-2 text-overline uppercase text-text-muted">Hint {i + 1}</span>
            {h}
          </div>
        </div>
      ))}

      <div className="flex flex-wrap gap-2 pt-1">
        {tier < hints.length && (
          <Button variant="secondary" size="sm" onClick={() => setTier((t) => t + 1)}>
            <Lightbulb size={14} /> Reveal hint {tier + 1} of {hints.length}
          </Button>
        )}
        {tier === hints.length && !showSolution && (
          <Button variant="secondary" size="sm" onClick={() => setShowSolution(true)}>
            <KeyRound size={14} /> Reveal solution
          </Button>
        )}
      </div>

      {showSolution && (
        <div className="mt-2 animate-fadeUp rounded-sm border border-accent-100 bg-accent-50 p-4">
          <div className="mb-2 text-overline uppercase text-accent-700">Solution</div>
          <div className="whitespace-pre-wrap font-mono text-body text-text-primary">
            {solution}
          </div>
        </div>
      )}
    </div>
  );
}
