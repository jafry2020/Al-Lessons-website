import { auth } from "./auth";
import { prisma } from "./db";
import { loadAllLessons, type LessonRecord } from "./content";
import { TRACKS, type TrackEntry, type ModuleEntry } from "./content-registry";

export interface CatalogLessonRow {
  lessonCode: string;
  title: string;
  estMinutes: number;
  href: string;
  status: "complete" | "in-progress" | "not-started" | "coming-soon";
}

export interface CatalogModule extends ModuleEntry {
  lessons: CatalogLessonRow[];
}

export interface CatalogTrack extends TrackEntry {
  modules: CatalogModule[];
  total: number;
  completed: number;
  authored: number; // lessons that have an MDX file
}

/**
 * Assembles the full catalog: every track and module from the registry,
 * cross-joined with whatever .mdx files actually exist, optionally with
 * progress for the signed-in user. Modules with zero authored lessons are
 * still listed (with no rows) so /tracks shows the full plan from day one.
 */
export async function loadCatalog(): Promise<CatalogTrack[]> {
  const [lessons, userId] = await Promise.all([loadAllLessons(), currentUserId()]);

  const progressByKey = await loadProgressMap(userId, lessons);
  const lessonsByModule = groupLessonsByModule(lessons);

  return TRACKS.map((track) => {
    const modules = track.modules.map<CatalogModule>((mod) => {
      const lessonsHere = lessonsByModule.get(`${track.slug}/${mod.slug}`) ?? [];
      const sorted = [...lessonsHere].sort((a, b) =>
        a.frontmatter.lessonCode.localeCompare(b.frontmatter.lessonCode, undefined, {
          numeric: true,
        })
      );
      return {
        ...mod,
        lessons: sorted.map<CatalogLessonRow>((l) => {
          const k = lessonKey(l);
          const p = progressByKey.get(k);
          return {
            lessonCode: l.frontmatter.lessonCode,
            title: l.frontmatter.title,
            estMinutes: l.frontmatter.estMinutes,
            href: l.href,
            status: p ? (p.completedAt ? "complete" : "in-progress") : "not-started",
          };
        }),
      };
    });

    const allRows = modules.flatMap((m) => m.lessons);
    return {
      ...track,
      modules,
      total: allRows.length,
      authored: allRows.length,
      completed: allRows.filter((r) => r.status === "complete").length,
    };
  });
}

export async function loadCatalogTrack(trackSlug: string): Promise<CatalogTrack | null> {
  const all = await loadCatalog();
  return all.find((t) => t.slug === trackSlug) ?? null;
}

// ---------------------------------------------------------------------------
// helpers
// ---------------------------------------------------------------------------

function lessonKey(l: LessonRecord): string {
  return `${l.frontmatter.track}/${l.frontmatter.module}/${l.frontmatter.lesson}`;
}

function groupLessonsByModule(lessons: LessonRecord[]): Map<string, LessonRecord[]> {
  const out = new Map<string, LessonRecord[]>();
  for (const l of lessons) {
    const k = `${l.frontmatter.track}/${l.frontmatter.module}`;
    if (!out.has(k)) out.set(k, []);
    out.get(k)!.push(l);
  }
  return out;
}

async function currentUserId(): Promise<string | null> {
  const session = await auth();
  return session?.user?.id ?? null;
}

async function loadProgressMap(
  userId: string | null,
  lessons: LessonRecord[]
): Promise<Map<string, { completedAt: Date | null }>> {
  if (!userId) return new Map();
  const rows = await prisma.lessonProgress.findMany({
    where: {
      userId,
      OR: lessons.map((l) => ({
        track: l.frontmatter.track,
        module: l.frontmatter.module,
        lesson: l.frontmatter.lesson,
      })),
    },
    select: { track: true, module: true, lesson: true, completedAt: true },
  });
  return new Map(rows.map((r) => [`${r.track}/${r.module}/${r.lesson}`, r] as const));
}
