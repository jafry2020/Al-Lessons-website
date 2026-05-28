import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Check, Circle, CircleDot, Clock, Lock } from "lucide-react";
import { loadCatalogTrack, type CatalogLessonRow } from "@/lib/catalog";
import { TRACKS } from "@/lib/content-registry";
import { Badge } from "@/components/ui/Badge";

interface Params {
  track: string;
}

export async function generateStaticParams(): Promise<Params[]> {
  return TRACKS.map((t) => ({ track: t.slug }));
}

export async function generateMetadata({ params }: { params: Promise<Params> }): Promise<Metadata> {
  const p = await params;
  const t = TRACKS.find((x) => x.slug === p.track);
  return t ? { title: t.label, description: t.tagline } : { title: "Track not found" };
}

// Per-user progress is read inline — render dynamic.
export const dynamic = "force-dynamic";

export default async function TrackOverviewPage({ params }: { params: Promise<Params> }) {
  const p = await params;
  const track = await loadCatalogTrack(p.track);
  if (!track) notFound();

  const pct = track.total === 0 ? 0 : Math.round((track.completed / track.total) * 100);

  return (
    <article className="mx-auto max-w-[1200px] px-6 py-10">
      <nav className="mb-6 text-caption text-text-muted">
        <Link href="/tracks" className="hover:text-text-primary">
          ← All tracks
        </Link>
      </nav>

      <header className="mb-10 border-b border-border-subtle pb-10">
        <Badge tone="accent">{track.modules.length} modules</Badge>
        <h1 className="mt-4 text-h1 tracking-tight">{track.label}</h1>
        <p className="mt-2 max-w-prose text-body-lg text-text-secondary">{track.tagline}</p>
        <p className="mt-4 max-w-prose text-body text-text-secondary">{track.description}</p>

        {track.completed > 0 && (
          <div className="mt-6 max-w-md">
            <div className="mb-1.5 flex items-baseline justify-between text-caption text-text-muted">
              <span>Your progress</span>
              <span className="font-mono">
                {track.completed} / {track.total} ({pct}%)
              </span>
            </div>
            <div className="h-1.5 overflow-hidden rounded-full bg-subtle">
              <div className="h-full rounded-full bg-accent-500" style={{ width: `${pct}%` }} />
            </div>
          </div>
        )}
      </header>

      <div className="space-y-6">
        {track.modules.map((m) => (
          <section
            key={m.slug}
            className="overflow-hidden rounded-md border border-border-subtle bg-surface"
          >
            <div className="flex items-baseline justify-between border-b border-border-subtle px-5 py-3">
              <h2 className="text-h4">{m.label}</h2>
              <span className="font-mono text-caption text-text-muted">
                {m.lessons.length} lesson{m.lessons.length === 1 ? "" : "s"}
              </span>
            </div>

            {m.lessons.length === 0 ? (
              <div className="px-5 py-6 text-body-sm text-text-muted">
                <span className="inline-flex items-center gap-2">
                  <Lock size={14} /> Coming soon
                </span>
              </div>
            ) : (
              <ul className="divide-y divide-border-subtle">
                {m.lessons.map((row) => (
                  <LessonLink key={row.href} row={row} />
                ))}
              </ul>
            )}
          </section>
        ))}
      </div>
    </article>
  );
}

function LessonLink({ row }: { row: CatalogLessonRow }) {
  return (
    <li>
      <Link
        href={row.href}
        className="flex items-center gap-4 px-5 py-3 transition-colors hover:bg-subtle"
      >
        <StatusIcon status={row.status} />
        <span className="w-12 font-mono text-caption text-text-muted">{row.lessonCode}</span>
        <span className="min-w-0 flex-1 truncate text-body">{row.title}</span>
        <span className="inline-flex shrink-0 items-center gap-1 text-caption text-text-muted">
          <Clock size={12} /> {row.estMinutes} min
        </span>
      </Link>
    </li>
  );
}

function StatusIcon({ status }: { status: CatalogLessonRow["status"] }) {
  if (status === "complete") return <Check size={16} className="shrink-0 text-success" />;
  if (status === "in-progress") return <CircleDot size={16} className="shrink-0 text-accent-500" />;
  return <Circle size={16} className="shrink-0 text-text-muted" />;
}
