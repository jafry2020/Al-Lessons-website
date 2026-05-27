import type { TrackSummary } from "@/lib/progress";

interface Props {
  tracks: TrackSummary[];
}

export function TrackProgressList({ tracks }: Props) {
  return (
    <ul className="space-y-3">
      {tracks.map((t) => {
        const pct = t.total === 0 ? 0 : Math.round((t.completed / t.total) * 100);
        return (
          <li key={t.track} className="rounded-md border border-border-subtle bg-surface p-4">
            <div className="flex items-baseline justify-between gap-3">
              <div className="text-body-sm font-medium">{t.trackLabel}</div>
              <div className="font-mono text-caption text-text-muted">
                {t.completed} / {t.total}
              </div>
            </div>
            <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-subtle">
              <div
                className="h-full rounded-full bg-accent-500 transition-all"
                style={{ width: `${pct}%` }}
                role="progressbar"
                aria-valuenow={pct}
                aria-valuemin={0}
                aria-valuemax={100}
              />
            </div>
          </li>
        );
      })}
    </ul>
  );
}
