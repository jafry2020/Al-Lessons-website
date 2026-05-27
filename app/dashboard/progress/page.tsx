import type { Metadata } from "next";
import Link from "next/link";
import { Check, Circle, CircleDot } from "lucide-react";
import { requireAuth } from "@/lib/require-auth";
import { loadAllLessons } from "@/lib/content";
import { prisma } from "@/lib/db";
import { TrackProgressList } from "@/components/dashboard/TrackProgressList";

export const metadata: Metadata = { title: "Your progress" };

interface LessonRow {
  track: string;
  module: string;
  lesson: string;
  lessonCode: string;
  title: string;
  href: string;
  status: "complete" | "in-progress" | "not-started";
}

export default async function ProgressPage() {
  const user = await requireAuth("/dashboard/progress");

  const [lessons, progressRows] = await Promise.all([
    loadAllLessons(),
    prisma.lessonProgress.findMany({ where: { userId: user.id } }),
  ]);

  const statusByKey = new Map<string, "complete" | "in-progress">();
  for (const row of progressRows) {
    const k = `${row.track}/${row.module}/${row.lesson}`;
    statusByKey.set(k, row.completedAt ? "complete" : "in-progress");
  }

  // Group lessons by track, then module.
  const byTrack = new Map<
    string,
    { trackLabel: string; modules: Map<string, { moduleLabel: string; rows: LessonRow[] }> }
  >();

  for (const l of lessons) {
    const fm = l.frontmatter;
    const trackBucket = byTrack.get(fm.track) ?? {
      trackLabel: fm.trackLabel,
      modules: new Map<string, { moduleLabel: string; rows: LessonRow[] }>(),
    };
    const moduleBucket = trackBucket.modules.get(fm.module) ?? {
      moduleLabel: fm.moduleLabel,
      rows: [],
    };
    moduleBucket.rows.push({
      track: fm.track,
      module: fm.module,
      lesson: fm.lesson,
      lessonCode: fm.lessonCode,
      title: fm.title,
      href: l.href,
      status: statusByKey.get(`${fm.track}/${fm.module}/${fm.lesson}`) ?? "not-started",
    });
    trackBucket.modules.set(fm.module, moduleBucket);
    byTrack.set(fm.track, trackBucket);
  }

  const tracks = Array.from(byTrack.entries()).sort(([, a], [, b]) =>
    a.trackLabel.localeCompare(b.trackLabel)
  );

  // Summary for the sidebar.
  const trackSummaries = tracks.map(([track, info]) => {
    const all = Array.from(info.modules.values()).flatMap((m) => m.rows);
    return {
      track,
      trackLabel: info.trackLabel,
      total: all.length,
      completed: all.filter((r) => r.status === "complete").length,
    };
  });

  return (
    <div className="mx-auto max-w-[1200px] px-6 py-10">
      <header className="mb-10">
        <div className="text-overline uppercase text-text-muted">Progress</div>
        <h1 className="mt-1 text-h1 tracking-tight">Your progress</h1>
      </header>

      <div className="grid gap-10 lg:grid-cols-[minmax(0,1fr)_320px]">
        <div className="space-y-10">
          {tracks.map(([trackKey, info]) => (
            <section key={trackKey}>
              <h2 className="mb-4 text-h2 tracking-tight">{info.trackLabel}</h2>
              <div className="space-y-6">
                {Array.from(info.modules.values()).map((m) => (
                  <div
                    key={m.moduleLabel}
                    className="overflow-hidden rounded-md border border-border-subtle bg-surface"
                  >
                    <div className="border-b border-border-subtle px-5 py-3 text-overline uppercase text-text-secondary">
                      {m.moduleLabel}
                    </div>
                    <ul className="divide-y divide-border-subtle">
                      {m.rows.map((row) => (
                        <li key={row.href}>
                          <Link
                            href={row.href}
                            className="flex items-center gap-4 px-5 py-3 transition-colors hover:bg-subtle"
                          >
                            <StatusIcon status={row.status} />
                            <span className="font-mono text-caption text-text-muted">
                              {row.lessonCode}
                            </span>
                            <span className="min-w-0 flex-1 truncate text-body">{row.title}</span>
                            <span className="shrink-0 text-caption text-text-muted">
                              {labelFor(row.status)}
                            </span>
                          </Link>
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            </section>
          ))}
        </div>

        <aside className="space-y-6">
          <section>
            <h2 className="mb-3 text-h4">Track totals</h2>
            <TrackProgressList tracks={trackSummaries} />
          </section>
        </aside>
      </div>
    </div>
  );
}

function StatusIcon({ status }: { status: LessonRow["status"] }) {
  if (status === "complete") return <Check size={16} className="shrink-0 text-success" />;
  if (status === "in-progress") return <CircleDot size={16} className="shrink-0 text-accent-500" />;
  return <Circle size={16} className="shrink-0 text-text-muted" />;
}

function labelFor(status: LessonRow["status"]): string {
  if (status === "complete") return "Complete";
  if (status === "in-progress") return "In progress";
  return "Not started";
}
