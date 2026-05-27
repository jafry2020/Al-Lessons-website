"use client";

import { useState } from "react";
import { Check, X, ChevronDown } from "lucide-react";
import { cn } from "@/lib/cn";

interface Option {
  text: string;
  correct?: boolean;
}

interface Props {
  question: string;
  options: Option[];
  explanation: string;
}

export function InlineQuiz({ question, options, explanation }: Props) {
  const [picked, setPicked] = useState<number | null>(null);
  const [showExplain, setShowExplain] = useState(false);

  const result = picked === null ? null : options[picked].correct ? "correct" : "wrong";

  return (
    <div className="my-8 rounded-md border border-border-subtle bg-surface p-6">
      <div className="mb-3 flex items-center gap-2 text-overline uppercase text-text-secondary">
        Quick check
      </div>
      <p className="mb-5 text-h4">{question}</p>
      <div className="grid gap-2">
        {options.map((opt, i) => {
          const isPicked = picked === i;
          const reveal = picked !== null;
          const state = !reveal
            ? "idle"
            : isPicked && opt.correct
              ? "correct"
              : isPicked && !opt.correct
                ? "wrong"
                : opt.correct
                  ? "answer"
                  : "muted";
          return (
            <button
              key={i}
              disabled={picked !== null}
              onClick={() => {
                setPicked(i);
                setShowExplain(true);
              }}
              className={cn(
                "group flex items-center gap-3 rounded-sm border px-4 py-3 text-left transition-all",
                state === "idle" &&
                  "border-border-strong bg-surface hover:border-accent-300 hover:bg-subtle",
                state === "correct" && "border-success bg-success/10 text-text-primary",
                state === "wrong" && "animate-shake border-danger bg-danger/10 text-text-primary",
                state === "answer" && "border-success/60 bg-success/5 text-text-primary",
                state === "muted" && "border-border-subtle opacity-60"
              )}
            >
              <span
                className={cn(
                  "grid h-5 w-5 shrink-0 place-items-center rounded-full border text-caption font-semibold",
                  state === "idle" && "border-border-strong text-text-muted",
                  state === "correct" && "border-success bg-success text-white",
                  state === "wrong" && "border-danger bg-danger text-white",
                  state === "answer" && "border-success text-success",
                  state === "muted" && "border-border-subtle text-text-muted"
                )}
              >
                {state === "correct" || state === "answer" ? (
                  <Check size={12} />
                ) : state === "wrong" ? (
                  <X size={12} />
                ) : (
                  String.fromCharCode(65 + i)
                )}
              </span>
              <span className="text-body">{opt.text}</span>
            </button>
          );
        })}
      </div>

      {picked !== null && (
        <div className="mt-5">
          <button
            onClick={() => setShowExplain((s) => !s)}
            className="flex items-center gap-1 text-body-sm text-text-secondary hover:text-text-primary"
          >
            <ChevronDown
              size={14}
              className={cn("transition-transform", showExplain && "rotate-180")}
            />
            {showExplain ? "Hide explanation" : "Show explanation"}
          </button>
          {showExplain && (
            <div className="mt-3 animate-fadeUp rounded-sm border border-border-subtle bg-subtle p-4 text-body text-text-secondary">
              <div
                className={cn(
                  "mb-1 text-overline uppercase",
                  result === "correct" ? "text-success" : "text-danger"
                )}
              >
                {result === "correct" ? "Correct" : "Not quite"}
              </div>
              {explanation}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
