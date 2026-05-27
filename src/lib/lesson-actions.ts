"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { auth } from "./auth";
import { prisma } from "./db";
import { loadAllLessons } from "./content";

interface LessonKey {
  track: string;
  module: string;
  lesson: string;
}

/**
 * Called from the lesson page on first render. Idempotent — if the row
 * exists, bumps lastVisitedAt; otherwise creates it with completedAt=null.
 * Anonymous viewers are a no-op.
 */
export async function trackLessonVisit(key: LessonKey): Promise<void> {
  const session = await auth();
  if (!session?.user?.id) return;

  await prisma.lessonProgress.upsert({
    where: {
      userId_track_module_lesson: {
        userId: session.user.id,
        track: key.track,
        module: key.module,
        lesson: key.lesson,
      },
    },
    create: {
      userId: session.user.id,
      track: key.track,
      module: key.module,
      lesson: key.lesson,
      lastVisitedAt: new Date(),
    },
    update: {
      lastVisitedAt: new Date(),
    },
  });
}

/**
 * Form-action: mark a lesson complete, then navigate to the next lesson.
 * If there is no next lesson, go to /dashboard.
 *
 * Auth-required. Unauthenticated callers are redirected to /signin.
 */
export async function markLessonComplete(formData: FormData): Promise<void> {
  const session = await auth();
  const track = String(formData.get("track") ?? "");
  const moduleSlug = String(formData.get("module") ?? "");
  const lesson = String(formData.get("lesson") ?? "");

  if (!track || !moduleSlug || !lesson) {
    throw new Error("markLessonComplete: missing lesson key");
  }

  const callbackUrl = `/tracks/${track}/${moduleSlug}/${lesson}`;
  if (!session?.user?.id) {
    redirect(`/signin?callbackUrl=${encodeURIComponent(callbackUrl)}`);
  }

  const now = new Date();
  await prisma.lessonProgress.upsert({
    where: {
      userId_track_module_lesson: {
        userId: session.user.id,
        track,
        module: moduleSlug,
        lesson,
      },
    },
    create: {
      userId: session.user.id,
      track,
      module: moduleSlug,
      lesson,
      completedAt: now,
      lastVisitedAt: now,
    },
    update: {
      completedAt: now,
      lastVisitedAt: now,
    },
  });

  // Dashboard and progress page both reflect this — bust the cache.
  revalidatePath("/dashboard");
  revalidatePath("/dashboard/progress");
  revalidatePath(callbackUrl);

  // Navigate to next lesson if one exists, otherwise back to dashboard.
  const next = await nextLessonHref({ track, module: moduleSlug, lesson });
  redirect(next ?? "/dashboard");
}

async function nextLessonHref(current: LessonKey): Promise<string | null> {
  const all = await loadAllLessons();
  const sorted = [...all].sort((a, b) =>
    a.frontmatter.lessonCode.localeCompare(b.frontmatter.lessonCode, undefined, {
      numeric: true,
    })
  );
  const idx = sorted.findIndex(
    (l) =>
      l.frontmatter.track === current.track &&
      l.frontmatter.module === current.module &&
      l.frontmatter.lesson === current.lesson
  );
  if (idx === -1) return null;
  const next = sorted[idx + 1];
  return next?.href ?? null;
}

/** Read-only helper for the lesson page. */
export async function getLessonProgress(key: LessonKey): Promise<{
  completedAt: Date | null;
} | null> {
  const session = await auth();
  if (!session?.user?.id) return null;
  return prisma.lessonProgress.findUnique({
    where: {
      userId_track_module_lesson: {
        userId: session.user.id,
        track: key.track,
        module: key.module,
        lesson: key.lesson,
      },
    },
    select: { completedAt: true },
  });
}
