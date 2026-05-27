import Link from "next/link";
import { ArrowRight, PlayCircle } from "lucide-react";
import { Badge } from "@/components/ui/Badge";
import type { LessonRecord } from "@/lib/content";

interface Props {
  lesson: LessonRecord | null;
  fallback: LessonRecord | null;
}

export function ContinueLearningCard({ lesson, fallback }: Props) {
  // If they have something in-progress, show that. Otherwise show the very
  // first lesson as a "start here" suggestion.
  const target = lesson ?? fallback;
  const isResume = lesson !== null;

  if (!target) {
    return (
      <div className="rounded-md border border-border-subtle bg-surface p-6 text-text-secondary">
        No lessons available yet. Check back soon.
      </div>
    );
  }

  const fm = target.frontmatter;

  return (
    <Link
      href={target.href}
      className="group block rounded-md border border-border-subtle bg-surface p-6 transition-all hover:-translate-y-0.5 hover:border-border-strong hover:shadow-md"
    >
      <div className="flex items-center gap-2">
        <Badge tone="accent">{isResume ? "Pick up where you left off" : "Recommended start"}</Badge>
      </div>

      <div className="mt-4 flex items-start gap-4">
        <div className="grid h-12 w-12 shrink-0 place-items-center rounded-md bg-accent-50 text-accent-700">
          <PlayCircle size={22} />
        </div>
        <div className="min-w-0 flex-1">
          <div className="text-overline uppercase text-text-muted">
            {fm.trackLabel} · {fm.moduleLabel}
          </div>
          <h3 className="mt-1 text-h3 leading-tight">{fm.title}</h3>
          <p className="mt-2 line-clamp-2 text-body text-text-secondary">{fm.description}</p>
        </div>
      </div>

      <div className="mt-5 flex items-center gap-2 text-body-sm font-medium text-accent-500 transition-all group-hover:gap-3">
        {isResume ? "Continue lesson" : "Start lesson"} <ArrowRight size={14} />
      </div>
    </Link>
  );
}
