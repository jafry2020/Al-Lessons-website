import { prisma } from "./db";
import { loadAllLessons, type LessonRecord } from "./content";

export interface DashboardSnapshot {
  userId: string;
  totalLessons: number;
  completedCount: number;
  inProgressCount: number;
  streakDays: number;
  lastCompletedAt: Date | null;
  /** Most recently visited lesson that is not yet completed. */
  continueLearning: LessonRecord | null;
  /**
   * Next lessons to recommend — the first 3 incomplete lessons across the
   * lesson catalog (ordered by lessonCode for now).
   */
  recommended: LessonRecord[];
  /** Per-track progress summary for the dashboard sidebar. */
  trackSummaries: TrackSummary[];
}

export interface TrackSummary {
  track: string;
  trackLabel: string;
  total: number;
  completed: number;
}

export async function getDashboardSnapshot(userId: string): Promise<DashboardSnapshot> {
  const [lessons, progressRows] = await Promise.all([
    loadAllLessons(),
    prisma.lessonProgress.findMany({
      where: { userId },
      orderBy: { lastVisitedAt: "desc" },
    }),
  ]);

  // Index lessons by lookup key.
  const lessonKey = (l: { track: string; module: string; lesson: string }) =>
    `${l.track}/${l.module}/${l.lesson}`;
  const lessonByKey = new Map(lessons.map((l) => [lessonKey(l.frontmatter), l] as const));

  const completedKeys = new Set(progressRows.filter((r) => r.completedAt).map((r) => lessonKey(r)));
  const inProgressKeys = new Set(
    progressRows.filter((r) => !r.completedAt).map((r) => lessonKey(r))
  );

  // Continue-learning: most recently visited row that's not completed.
  const continueRow = progressRows.find((r) => !r.completedAt) ?? null;
  const continueLearning = continueRow ? (lessonByKey.get(lessonKey(continueRow)) ?? null) : null;

  // Recommended: first ~3 lessons (by lessonCode) the user hasn't completed
  // and isn't currently mid-way through.
  const sortedLessons = [...lessons].sort((a, b) =>
    a.frontmatter.lessonCode.localeCompare(b.frontmatter.lessonCode, undefined, {
      numeric: true,
    })
  );
  const recommended = sortedLessons
    .filter((l) => {
      const k = lessonKey(l.frontmatter);
      return !completedKeys.has(k) && !inProgressKeys.has(k);
    })
    .slice(0, 3);

  // Per-track summary.
  const trackTotals = new Map<string, TrackSummary>();
  for (const l of lessons) {
    const fm = l.frontmatter;
    const cur = trackTotals.get(fm.track) ?? {
      track: fm.track,
      trackLabel: fm.trackLabel,
      total: 0,
      completed: 0,
    };
    cur.total += 1;
    if (completedKeys.has(lessonKey(fm))) cur.completed += 1;
    trackTotals.set(fm.track, cur);
  }

  // Streak: count consecutive days (ending today or yesterday) on which the
  // user completed at least one lesson.
  const completedDates = progressRows
    .map((r) => r.completedAt)
    .filter((d): d is Date => d !== null)
    .map((d) => startOfDay(d))
    .sort((a, b) => b.getTime() - a.getTime());

  const streakDays = computeStreak(completedDates);
  const lastCompletedAt = completedDates[0] ?? null;

  return {
    userId,
    totalLessons: lessons.length,
    completedCount: completedKeys.size,
    inProgressCount: inProgressKeys.size,
    streakDays,
    lastCompletedAt,
    continueLearning,
    recommended,
    trackSummaries: Array.from(trackTotals.values()).sort((a, b) =>
      a.trackLabel.localeCompare(b.trackLabel)
    ),
  };
}

function startOfDay(d: Date): Date {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x;
}

function computeStreak(sortedDescDates: Date[]): number {
  if (sortedDescDates.length === 0) return 0;

  const today = startOfDay(new Date());
  const yesterday = new Date(today);
  yesterday.setDate(today.getDate() - 1);

  // Streak only counts if the most-recent completion is today or yesterday.
  const newest = sortedDescDates[0];
  if (newest.getTime() !== today.getTime() && newest.getTime() !== yesterday.getTime()) {
    return 0;
  }

  // Walk back through unique days, allowing one-day gaps to break the streak.
  const uniqDays = Array.from(new Set(sortedDescDates.map((d) => d.getTime()))).map(
    (t) => new Date(t)
  );
  let streak = 1;
  for (let i = 1; i < uniqDays.length; i += 1) {
    const prev = uniqDays[i - 1];
    const cur = uniqDays[i];
    const diffDays = Math.round((prev.getTime() - cur.getTime()) / 86_400_000);
    if (diffDays === 1) {
      streak += 1;
    } else {
      break;
    }
  }
  return streak;
}
