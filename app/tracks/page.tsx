import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, BarChart3, Layers } from "lucide-react";
import { loadCatalog, type CatalogTrack } from "@/lib/catalog";
import { Badge } from "@/components/ui/Badge";

export const metadata: Metadata = {
  title: "Tracks",
  description: "Two independent learning paths covering AI, ML, and Generative AI.",
};

const ICONS: Record<string, React.ReactNode> = {
  "ml-engineer": <BarChart3 size={20} />,
  "genai-builder": <Layers size={20} />,
};

export default async function TracksCatalogPage() {
  const tracks = await loadCatalog();

  return (
    <div className="mx-auto max-w-[1200px] px-6 py-12">
      <header className="mb-12 max-w-prose">
        <div className="text-overline uppercase text-accent-600">Two paths</div>
        <h1 className="mt-2 text-h1 tracking-tight">Pick how you want to think about AI.</h1>
        <p className="mt-3 text-body-lg text-text-secondary">
          Two fully independent tracks, each opening with its own tailored foundations. Start either
          one cold.
        </p>
      </header>

      <div className="grid gap-6 md:grid-cols-2">
        {tracks.map((t) => (
          <TrackCard key={t.slug} track={t} />
        ))}
      </div>
    </div>
  );
}

function TrackCard({ track }: { track: CatalogTrack }) {
  const pct = track.total === 0 ? 0 : Math.round((track.completed / track.total) * 100);
  return (
    <Link
      href={`/tracks/${track.slug}`}
      className="group flex flex-col rounded-md border border-border-subtle bg-surface p-6 shadow-sm transition-all hover:-translate-y-0.5 hover:border-border-strong hover:shadow-md"
    >
      <div className="mb-4 flex items-center gap-3">
        <div className="grid h-10 w-10 place-items-center rounded-md bg-accent-50 text-accent-700">
          {ICONS[track.slug] ?? null}
        </div>
        <Badge>
          {track.authored} / {track.modules.length * 0 + estimateTotal(track)} lessons ·{" "}
          {track.modules.length} modules
        </Badge>
      </div>

      <h3 className="text-h3">{track.label}</h3>
      <p className="mt-1 text-body text-text-secondary">{track.tagline}</p>
      <p className="mt-4 text-body text-text-secondary">{track.description}</p>

      <ol className="mt-6 space-y-1.5 text-body-sm">
        {track.modules.map((m, i) => (
          <li key={m.slug} className="flex items-baseline gap-3 text-text-secondary">
            <span className="w-6 font-mono text-caption text-text-muted">
              {String(i + 1).padStart(2, "0")}
            </span>
            <span>{stripModulePrefix(m.label)}</span>
            <span className="ml-auto font-mono text-caption text-text-muted">
              {m.lessons.length}
            </span>
          </li>
        ))}
      </ol>

      {track.completed > 0 && (
        <div className="mt-5">
          <div className="mb-1.5 flex items-baseline justify-between text-caption text-text-muted">
            <span>Your progress</span>
            <span className="font-mono">{pct}%</span>
          </div>
          <div className="h-1.5 overflow-hidden rounded-full bg-subtle">
            <div className="h-full rounded-full bg-accent-500" style={{ width: `${pct}%` }} />
          </div>
        </div>
      )}

      <div className="mt-6 flex items-center gap-2 border-t border-border-subtle pt-6 text-body-sm font-medium text-accent-500 transition-all group-hover:gap-3">
        Open the track <ArrowRight size={14} />
      </div>
    </Link>
  );
}

/**
 * Until the catalog is fully authored, show the published count.
 * Once the full curriculum lands this will equal track.total.
 */
function estimateTotal(track: CatalogTrack): number {
  return Math.max(track.authored, 1);
}

function stripModulePrefix(label: string): string {
  // "Module 4 · Neural Networks" → "Neural Networks"
  const idx = label.indexOf("·");
  return idx === -1 ? label : label.slice(idx + 1).trim();
}
