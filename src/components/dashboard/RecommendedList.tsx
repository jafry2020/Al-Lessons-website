import Link from "next/link";
import { ArrowRight, Clock } from "lucide-react";
import type { LessonRecord } from "@/lib/content";

interface Props {
  lessons: LessonRecord[];
}

export function RecommendedList({ lessons }: Props) {
  if (lessons.length === 0) {
    return (
      <div className="rounded-md border border-border-subtle bg-surface p-6 text-body text-text-secondary">
        You&apos;ve started every lesson in the catalog. Nicely done.
      </div>
    );
  }

  return (
    <ul className="divide-y divide-border-subtle overflow-hidden rounded-md border border-border-subtle bg-surface">
      {lessons.map((l) => {
        const fm = l.frontmatter;
        return (
          <li key={l.href}>
            <Link
              href={l.href}
              className="group flex items-center gap-4 px-5 py-4 transition-colors hover:bg-subtle"
            >
              <span className="font-mono text-caption text-text-muted">{fm.lessonCode}</span>
              <span className="min-w-0 flex-1">
                <span className="block truncate text-body font-medium text-text-primary">
                  {fm.title}
                </span>
                <span className="mt-0.5 flex items-center gap-3 text-caption text-text-muted">
                  <span>{fm.moduleLabel}</span>
                  <span aria-hidden>·</span>
                  <span className="inline-flex items-center gap-1">
                    <Clock size={12} /> {fm.estMinutes} min
                  </span>
                </span>
              </span>
              <ArrowRight
                size={16}
                className="shrink-0 text-text-muted transition-transform group-hover:translate-x-0.5 group-hover:text-text-primary"
              />
            </Link>
          </li>
        );
      })}
    </ul>
  );
}
