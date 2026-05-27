import Link from "next/link";
import { ChevronRight, Clock, BookOpen, ArrowRight } from "lucide-react";
import { Badge } from "@/components/ui/Badge";
import { ImportantQuestions } from "./ImportantQuestions";
import { PitfallsCallout } from "./Callouts";
import type { LessonRecord } from "@/lib/content";

interface Props {
  lesson: LessonRecord;
  children: React.ReactNode;
}

export function LessonLayout({ lesson, children }: Props) {
  const fm = lesson.frontmatter;
  return (
    <article className="max-w-[1200px] mx-auto px-6 py-10">
      {/* Breadcrumb */}
      <nav className="flex items-center gap-1.5 text-caption text-text-muted mb-6">
        <Link href="/" className="hover:text-text-primary">
          {fm.trackLabel}
        </Link>
        <ChevronRight size={12} />
        <span className="text-text-secondary">{fm.moduleLabel}</span>
        <ChevronRight size={12} />
        <span className="text-text-primary">Lesson {fm.lessonCode.split(".").pop()}</span>
      </nav>

      {/* Header */}
      <header className="mb-10 pb-10 border-b border-border-subtle">
        <Badge tone="accent" className="mb-4">
          {fm.lessonCode} · {fm.moduleLabel}
        </Badge>
        <h1 className="text-h1 tracking-tight max-w-3xl">{fm.title}</h1>
        <div className="mt-5 flex flex-wrap items-center gap-5 text-body-sm text-text-secondary">
          <span className="inline-flex items-center gap-2">
            <Clock size={14} /> {fm.estMinutes} min read
          </span>
          {fm.importantQuestions && fm.importantQuestions.length > 0 && (
            <span className="inline-flex items-center gap-2">
              <BookOpen size={14} /> {fm.importantQuestions.length} important questions
            </span>
          )}
          {fm.prereqs && fm.prereqs.length > 0 && (
            <span>Prereqs: {fm.prereqs.join(", ")}</span>
          )}
        </div>
      </header>

      <div className="grid lg:grid-cols-[180px_minmax(0,1fr)] gap-10">
        {/* Objectives rail */}
        <aside className="hidden lg:block sticky top-24 self-start text-caption">
          <div className="text-overline uppercase text-text-muted mb-3">
            Learning objectives
          </div>
          <ol className="space-y-2 text-text-secondary">
            {fm.objectives.map((o, i) => (
              <li key={i} className="leading-relaxed">
                <span className="font-mono text-text-muted mr-2">{i + 1}.</span>
                {o}
              </li>
            ))}
          </ol>
        </aside>

        {/* Body */}
        <div className="max-w-prose">
          {children}

          {fm.importantQuestions && fm.importantQuestions.length > 0 && (
            <ImportantQuestions items={fm.importantQuestions} />
          )}

          {fm.pitfalls && fm.pitfalls.length > 0 && (
            <PitfallsCallout items={fm.pitfalls} />
          )}

          <div className="mt-12 pt-8 border-t border-border-subtle flex items-center justify-between">
            <Link
              href="/"
              className="text-body-sm text-text-secondary hover:text-text-primary inline-flex items-center gap-1"
            >
              ← Back to track
            </Link>
            <button className="h-11 px-5 inline-flex items-center gap-2 rounded-md bg-accent-500 text-white font-medium hover:bg-accent-600 transition-colors shadow-sm">
              Mark complete & continue <ArrowRight size={16} />
            </button>
          </div>
        </div>
      </div>
    </article>
  );
}
