import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { loadGlossary } from "@/lib/glossary";

export const metadata: Metadata = {
  title: "Glossary",
  description:
    "Every technical term defined across Synapse — auto-extracted from lessons, with backlinks to where each term is introduced.",
};

export default async function GlossaryPage() {
  const entries = await loadGlossary();

  // Group by first letter for the alphabetical index.
  const buckets = new Map<string, typeof entries>();
  for (const e of entries) {
    const initial = (e.term[0] ?? "#").toUpperCase();
    const key = /[A-Z]/.test(initial) ? initial : "#";
    if (!buckets.has(key)) buckets.set(key, []);
    buckets.get(key)!.push(e);
  }
  const letters = Array.from(buckets.keys()).sort();

  return (
    <div className="mx-auto max-w-[1200px] px-6 py-10">
      <header className="mb-10 max-w-prose">
        <div className="text-overline uppercase text-text-muted">Glossary</div>
        <h1 className="mt-1 text-h1 tracking-tight">Every term, defined once.</h1>
        <p className="mt-3 text-body-lg text-text-secondary">
          Definitions are pulled directly from the lessons that introduce them — no second source to
          maintain. Hover the dotted-underline terms inside any lesson to see the same tooltip
          you&apos;d find here.
        </p>
      </header>

      {entries.length === 0 ? (
        <div className="rounded-md border border-border-subtle bg-surface p-6 text-body text-text-secondary">
          No terms defined yet.
        </div>
      ) : (
        <div className="grid gap-10 lg:grid-cols-[160px_minmax(0,1fr)]">
          {/* Sticky alphabetical jump-list */}
          <aside className="sticky top-24 hidden self-start lg:block">
            <div className="mb-3 text-overline uppercase text-text-muted">Jump to</div>
            <ul className="grid grid-cols-4 gap-1 text-caption">
              {letters.map((l) => (
                <li key={l}>
                  <a
                    href={`#letter-${l}`}
                    className="grid h-8 w-8 place-items-center rounded-sm text-text-secondary hover:bg-subtle hover:text-text-primary"
                  >
                    {l}
                  </a>
                </li>
              ))}
            </ul>
            <div className="mt-6 text-caption text-text-muted">
              {entries.length} term{entries.length === 1 ? "" : "s"}
            </div>
          </aside>

          {/* Term list */}
          <div className="max-w-prose space-y-10">
            {letters.map((letter) => (
              <section key={letter}>
                <h2
                  id={`letter-${letter}`}
                  className="mb-4 scroll-mt-24 text-h2 tracking-tight text-accent-500"
                >
                  {letter}
                </h2>
                <ul className="space-y-6">
                  {buckets.get(letter)!.map((entry) => (
                    <li
                      key={entry.slug}
                      id={entry.slug}
                      className="scroll-mt-24 border-l-2 border-border-subtle pl-5"
                    >
                      <h3 className="text-h4">{entry.term}</h3>
                      <p className="mt-1 text-body leading-relaxed text-text-secondary">
                        {entry.definition}
                      </p>
                      {entry.lessons.length > 0 && (
                        <div className="mt-3 flex flex-wrap items-center gap-3 text-caption text-text-muted">
                          <span className="text-overline uppercase">Introduced in</span>
                          {entry.lessons.map((l) => (
                            <Link
                              key={l.href}
                              href={l.href}
                              className="inline-flex items-center gap-1 rounded-sm bg-subtle px-2 py-0.5 text-text-secondary transition-colors hover:bg-accent-50 hover:text-accent-700"
                            >
                              <span className="font-mono">{l.lessonCode}</span>
                              <span className="truncate">{l.title}</span>
                              <ArrowRight size={10} />
                            </Link>
                          ))}
                        </div>
                      )}
                    </li>
                  ))}
                </ul>
              </section>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
