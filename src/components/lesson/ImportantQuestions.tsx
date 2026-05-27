"use client";

import { useState } from "react";
import { ChevronDown, BookMarked } from "lucide-react";
import { cn } from "@/lib/cn";

export interface ImportantQ {
  question: string;
  shortAnswer: string;
  detailed: string;
  pitfalls: string[];
}

type Tab = "short" | "detailed" | "pitfalls";

export function ImportantQuestions({ items }: { items: ImportantQ[] }) {
  const [open, setOpen] = useState<number | null>(0);
  const [tab, setTab] = useState<Record<number, Tab>>({});

  return (
    <section className="my-10">
      <div className="mb-4 flex items-center gap-2">
        <BookMarked size={18} className="text-accent-500" />
        <h2 className="text-h2">Important Questions</h2>
      </div>
      <p className="mb-6 max-w-prose text-body text-text-secondary">
        Interview-grade questions modeled on real exams and FAANG ML interviews. Each has a short
        answer, a detailed explanation, and common pitfalls.
      </p>

      <ol className="divide-y divide-border-subtle overflow-hidden rounded-md border border-border-subtle bg-surface">
        {items.map((q, i) => {
          const isOpen = open === i;
          const activeTab = tab[i] ?? "short";
          return (
            <li key={i}>
              <button
                onClick={() => setOpen(isOpen ? null : i)}
                className="flex w-full items-start gap-4 px-5 py-4 text-left transition-colors hover:bg-subtle"
              >
                <span className="w-6 pt-1 font-mono text-caption text-text-muted">
                  {String(i + 1).padStart(2, "0")}
                </span>
                <span className="flex-1 text-body-lg font-medium">{q.question}</span>
                <ChevronDown
                  size={18}
                  className={cn(
                    "mt-1 shrink-0 text-text-muted transition-transform",
                    isOpen && "rotate-180"
                  )}
                />
              </button>
              {isOpen && (
                <div className="animate-fadeUp px-5 pb-5 pl-[3.25rem]">
                  <div className="mb-4 inline-flex rounded-sm bg-subtle p-1">
                    {(["short", "detailed", "pitfalls"] as Tab[]).map((t) => (
                      <button
                        key={t}
                        onClick={() => setTab({ ...tab, [i]: t })}
                        className={cn(
                          "h-7 rounded-[4px] px-3 text-caption font-medium capitalize transition-colors",
                          activeTab === t
                            ? "bg-surface text-text-primary shadow-sm"
                            : "text-text-secondary hover:text-text-primary"
                        )}
                      >
                        {t === "short"
                          ? "Short answer"
                          : t === "detailed"
                            ? "Detailed"
                            : "Common pitfalls"}
                      </button>
                    ))}
                  </div>

                  {activeTab === "short" && (
                    <p className="text-body leading-relaxed text-text-primary">{q.shortAnswer}</p>
                  )}
                  {activeTab === "detailed" && (
                    <p className="whitespace-pre-line text-body leading-relaxed text-text-primary">
                      {q.detailed}
                    </p>
                  )}
                  {activeTab === "pitfalls" && (
                    <ul className="list-disc space-y-2 pl-5 text-body text-text-secondary">
                      {q.pitfalls.map((p, idx) => (
                        <li key={idx}>{p}</li>
                      ))}
                    </ul>
                  )}
                </div>
              )}
            </li>
          );
        })}
      </ol>
    </section>
  );
}
