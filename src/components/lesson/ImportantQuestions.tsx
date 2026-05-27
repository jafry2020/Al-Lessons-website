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
      <div className="flex items-center gap-2 mb-4">
        <BookMarked size={18} className="text-accent-500" />
        <h2 className="text-h2">Important Questions</h2>
      </div>
      <p className="text-body text-text-secondary mb-6 max-w-prose">
        Interview-grade questions modeled on real exams and FAANG ML interviews. Each
        has a short answer, a detailed explanation, and common pitfalls.
      </p>

      <ol className="border border-border-subtle rounded-md divide-y divide-border-subtle overflow-hidden bg-surface">
        {items.map((q, i) => {
          const isOpen = open === i;
          const activeTab = tab[i] ?? "short";
          return (
            <li key={i}>
              <button
                onClick={() => setOpen(isOpen ? null : i)}
                className="w-full text-left px-5 py-4 flex items-start gap-4 hover:bg-subtle transition-colors"
              >
                <span className="font-mono text-caption text-text-muted pt-1 w-6">
                  {String(i + 1).padStart(2, "0")}
                </span>
                <span className="flex-1 text-body-lg font-medium">{q.question}</span>
                <ChevronDown
                  size={18}
                  className={cn(
                    "text-text-muted shrink-0 mt-1 transition-transform",
                    isOpen && "rotate-180"
                  )}
                />
              </button>
              {isOpen && (
                <div className="px-5 pb-5 pl-[3.25rem] animate-fadeUp">
                  <div className="inline-flex rounded-sm bg-subtle p-1 mb-4">
                    {(["short", "detailed", "pitfalls"] as Tab[]).map((t) => (
                      <button
                        key={t}
                        onClick={() => setTab({ ...tab, [i]: t })}
                        className={cn(
                          "px-3 h-7 text-caption font-medium rounded-[4px] transition-colors capitalize",
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
                    <p className="text-body text-text-primary leading-relaxed">
                      {q.shortAnswer}
                    </p>
                  )}
                  {activeTab === "detailed" && (
                    <p className="text-body text-text-primary leading-relaxed whitespace-pre-line">
                      {q.detailed}
                    </p>
                  )}
                  {activeTab === "pitfalls" && (
                    <ul className="space-y-2 text-body text-text-secondary list-disc pl-5">
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
