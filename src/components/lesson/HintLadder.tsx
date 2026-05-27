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
          className="flex gap-3 p-3 bg-subtle border border-border-subtle rounded-sm animate-fadeUp"
        >
          <Lightbulb size={16} className="text-warning shrink-0 mt-0.5" />
          <div className="text-body-sm text-text-secondary">
            <span className="text-overline uppercase text-text-muted mr-2">
              Hint {i + 1}
            </span>
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
        <div className="mt-2 p-4 bg-accent-50 border border-accent-100 rounded-sm animate-fadeUp">
          <div className="text-overline uppercase text-accent-700 mb-2">Solution</div>
          <div className="text-body text-text-primary font-mono whitespace-pre-wrap">
            {solution}
          </div>
        </div>
      )}
    </div>
  );
}
