import type { Metadata } from "next";
import { requireAuth } from "@/lib/require-auth";
import { getDashboardSnapshot } from "@/lib/progress";
import { loadAllLessons } from "@/lib/content";
import { StreakWidget } from "@/components/dashboard/StreakWidget";
import { ContinueLearningCard } from "@/components/dashboard/ContinueLearningCard";
import { RecommendedList } from "@/components/dashboard/RecommendedList";
import { TrackProgressList } from "@/components/dashboard/TrackProgressList";

export const metadata: Metadata = { title: "Dashboard" };

export default async function DashboardPage() {
  const user = await requireAuth("/dashboard");

  const [snapshot, allLessons] = await Promise.all([
    getDashboardSnapshot(user.id),
    loadAllLessons(),
  ]);

  // If they have no in-progress lesson, suggest the first lesson as a start.
  const firstLesson = [...allLessons].sort((a, b) =>
    a.frontmatter.lessonCode.localeCompare(b.frontmatter.lessonCode, undefined, {
      numeric: true,
    })
  )[0];

  const firstName = (user.name ?? "").split(" ")[0];

  return (
    <div className="mx-auto max-w-[1200px] px-6 py-10">
      <header className="mb-10">
        <div className="text-overline uppercase text-text-muted">Dashboard</div>
        <h1 className="mt-1 text-h1 tracking-tight">
          {firstName ? `Welcome back, ${firstName}` : "Welcome back"}
        </h1>
        <p className="mt-2 text-body text-text-secondary">
          {snapshot.completedCount === 0
            ? "Ready when you are."
            : `${snapshot.completedCount} of ${snapshot.totalLessons} lessons complete.`}
        </p>
      </header>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_320px]">
        {/* Left column — the headline cards */}
        <div className="space-y-6">
          <StreakWidget days={snapshot.streakDays} lastCompletedAt={snapshot.lastCompletedAt} />

          <section>
            <h2 className="mb-3 text-h4">Continue learning</h2>
            <ContinueLearningCard lesson={snapshot.continueLearning} fallback={firstLesson} />
          </section>

          <section>
            <h2 className="mb-3 text-h4">Recommended next</h2>
            <RecommendedList lessons={snapshot.recommended} />
          </section>
        </div>

        {/* Right column — at-a-glance summaries */}
        <aside className="space-y-6">
          <section>
            <h2 className="mb-3 text-h4">Track progress</h2>
            <TrackProgressList tracks={snapshot.trackSummaries} />
          </section>
        </aside>
      </div>
    </div>
  );
}
