import { Flame } from "lucide-react";

interface Props {
  days: number;
  lastCompletedAt: Date | null;
}

export function StreakWidget({ days, lastCompletedAt }: Props) {
  const isActive = days > 0;
  return (
    <div className="flex items-start gap-4 rounded-md border border-border-subtle bg-surface p-5">
      <div
        className={
          "grid h-12 w-12 shrink-0 place-items-center rounded-md " +
          (isActive ? "bg-warning/10 text-warning" : "bg-subtle text-text-muted")
        }
      >
        <Flame size={22} strokeWidth={2.25} />
      </div>
      <div>
        <div className="text-overline uppercase text-text-muted">Streak</div>
        <div className="mt-0.5 text-h3">
          {days} {days === 1 ? "day" : "days"}
        </div>
        <div className="mt-1 text-body-sm text-text-secondary">
          {isActive
            ? `Last lesson finished ${formatRelative(lastCompletedAt!)}.`
            : "Complete a lesson today to start a streak."}
        </div>
      </div>
    </div>
  );
}

function formatRelative(d: Date): string {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const target = new Date(d);
  target.setHours(0, 0, 0, 0);
  const diff = Math.round((today.getTime() - target.getTime()) / 86_400_000);
  if (diff === 0) return "today";
  if (diff === 1) return "yesterday";
  if (diff < 7) return `${diff} days ago`;
  return d.toLocaleDateString(undefined, { month: "short", day: "numeric" });
}
