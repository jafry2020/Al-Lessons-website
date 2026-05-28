import { loadAllLessons, type LessonRecord } from "./content";

/**
 * Auto-extracted glossary.
 *
 * Walks every .mdx body and pulls out each `<GlossaryTerm term="..." definition="...">`
 * invocation. Definitions across lessons must agree — if two lessons define
 * the same term differently, we throw. The result is a single deduplicated
 * map of term → { definition, lessons that mention it }.
 *
 * The regex is intentionally conservative: it only matches the canonical
 * shape produced by the MDX shortcode. If authors start writing exotic
 * invocations (computed props, etc.) this scanner won't see them — that's a
 * feature, not a bug: we want a stable contract for what "defines" a term.
 */

export interface GlossaryEntry {
  term: string;
  slug: string;
  definition: string;
  lessons: { href: string; title: string; lessonCode: string }[];
}

// Matches <GlossaryTerm term="..." definition="..."> in any order of the two
// attributes. Allows double-quoted or single-quoted values, but rejects
// expression-style props ({...}) — those would need a real MDX AST walker.
const TERM_RE =
  /<GlossaryTerm\s+(?=[^>]*term=("([^"]+)"|'([^']+)'))(?=[^>]*definition=("([^"]+)"|'([^']+)'))[^>]*>/g;

let cache: Promise<GlossaryEntry[]> | null = null;

export function loadGlossary(): Promise<GlossaryEntry[]> {
  if (!cache) {
    cache = (async () => {
      const lessons = await loadAllLessons();
      return buildGlossary(lessons);
    })();
  }
  return cache;
}

export function termSlug(term: string): string {
  return term
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function buildGlossary(lessons: LessonRecord[]): GlossaryEntry[] {
  // term → entry
  const map = new Map<string, GlossaryEntry>();
  // For conflict reporting:
  const definitionSources = new Map<string, string>(); // term → source href

  for (const lesson of lessons) {
    const body = lesson.body;
    // Reset lastIndex because the regex has the /g flag.
    TERM_RE.lastIndex = 0;

    let match: RegExpExecArray | null;
    while ((match = TERM_RE.exec(body)) !== null) {
      const term = (match[2] ?? match[3] ?? "").trim();
      const definition = (match[5] ?? match[6] ?? "").trim();
      if (!term || !definition) continue;

      const slug = termSlug(term);
      const existing = map.get(slug);

      if (existing) {
        if (existing.definition !== definition) {
          const prevSource = definitionSources.get(slug) ?? "(unknown)";
          throw new Error(
            `[glossary] Conflicting definitions for '${term}':\n` +
              `  in ${prevSource}:\n    ${existing.definition}\n` +
              `  in ${lesson.href}:\n    ${definition}\n` +
              `Resolve by aligning the wording, or use distinct terms.`
          );
        }
        // Same definition reused — just record the backlink (deduplicated).
        if (!existing.lessons.some((l) => l.href === lesson.href)) {
          existing.lessons.push({
            href: lesson.href,
            title: lesson.frontmatter.title,
            lessonCode: lesson.frontmatter.lessonCode,
          });
        }
      } else {
        map.set(slug, {
          term,
          slug,
          definition,
          lessons: [
            {
              href: lesson.href,
              title: lesson.frontmatter.title,
              lessonCode: lesson.frontmatter.lessonCode,
            },
          ],
        });
        definitionSources.set(slug, lesson.href);
      }
    }
  }

  return Array.from(map.values()).sort((a, b) => a.term.localeCompare(b.term));
}
