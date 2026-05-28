import { promises as fs } from "node:fs";
import path from "node:path";
import matter from "gray-matter";
import { z } from "zod";
import { expectedLabels, isValidModule, isValidTrack } from "./content-registry";

const CONTENT_ROOT = path.join(process.cwd(), "content");

// ---------------------------------------------------------------------------
// Frontmatter schema (Zod)
// ---------------------------------------------------------------------------

const importantQuestionSchema = z.object({
  question: z.string().min(1),
  shortAnswer: z.string().min(1),
  detailed: z.string().min(1),
  pitfalls: z.array(z.string().min(1)).default([]),
});

export const lessonFrontmatterSchema = z.object({
  title: z.string().min(1).max(160),
  description: z.string().min(1).optional(),
  track: z.string().min(1),
  module: z.string().min(1),
  lesson: z
    .string()
    .min(1)
    .regex(/^[a-z0-9-]+$/, "lesson slug must be kebab-case (lowercase, digits, dashes)"),
  moduleLabel: z.string().min(1),
  trackLabel: z.string().min(1),
  lessonCode: z
    .string()
    .min(1)
    .regex(/^[A-Z][0-9]+(\.[0-9]+)?$/, "lessonCode must look like A4.5 or B.Cap"),
  estMinutes: z.number().int().positive().max(120),
  objectives: z.array(z.string().min(1)).min(1).max(8),
  prereqs: z.array(z.string().min(1)).optional(),
  pitfalls: z.array(z.string().min(1)).optional(),
  importantQuestions: z.array(importantQuestionSchema).optional(),
});

export type LessonFrontmatter = z.infer<typeof lessonFrontmatterSchema>;
export type ImportantQuestion = z.infer<typeof importantQuestionSchema>;

export interface LessonRecord {
  frontmatter: LessonFrontmatter;
  body: string;
  href: string;
  filePath: string;
}

// ---------------------------------------------------------------------------
// Validation — registry-aware
// ---------------------------------------------------------------------------

function validate(data: unknown, filePath: string): LessonFrontmatter {
  const where = path.relative(process.cwd(), filePath);
  const parsed = lessonFrontmatterSchema.safeParse(data);
  if (!parsed.success) {
    const issues = parsed.error.issues
      .map((i) => `    · ${i.path.join(".") || "(root)"}: ${i.message}`)
      .join("\n");
    throw new Error(`[content] ${where} — frontmatter is invalid:\n${issues}`);
  }
  const fm = parsed.data;

  if (!isValidTrack(fm.track)) {
    throw new Error(
      `[content] ${where} — unknown track slug '${fm.track}'. ` +
        `Add it to src/lib/content-registry.ts or fix the typo.`
    );
  }
  if (!isValidModule(fm.track, fm.module)) {
    throw new Error(
      `[content] ${where} — unknown module '${fm.module}' for track '${fm.track}'. ` +
        `Check src/lib/content-registry.ts.`
    );
  }

  const expected = expectedLabels(fm.track, fm.module)!;
  if (fm.trackLabel !== expected.trackLabel) {
    throw new Error(
      `[content] ${where} — trackLabel '${fm.trackLabel}' does not match registry ` +
        `('${expected.trackLabel}'). Use the registry value verbatim.`
    );
  }
  if (fm.moduleLabel !== expected.moduleLabel) {
    throw new Error(
      `[content] ${where} — moduleLabel '${fm.moduleLabel}' does not match registry ` +
        `('${expected.moduleLabel}'). Use the registry value verbatim.`
    );
  }

  return fm;
}

// ---------------------------------------------------------------------------
// Loaders
// ---------------------------------------------------------------------------

async function walkMdx(dir: string): Promise<string[]> {
  const out: string[] = [];
  let entries;
  try {
    entries = await fs.readdir(dir, { withFileTypes: true });
  } catch {
    return out;
  }
  for (const entry of entries) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      out.push(...(await walkMdx(full)));
    } else if (entry.isFile() && entry.name.endsWith(".mdx")) {
      out.push(full);
    }
  }
  return out;
}

async function loadFile(filePath: string): Promise<LessonRecord> {
  const raw = await fs.readFile(filePath, "utf8");
  const { data, content } = matter(raw);
  const fm = validate(data, filePath);
  return {
    frontmatter: fm,
    body: content,
    href: `/tracks/${fm.track}/${fm.module}/${fm.lesson}`,
    filePath,
  };
}

let cache: Promise<LessonRecord[]> | null = null;

export function loadAllLessons(): Promise<LessonRecord[]> {
  if (!cache) {
    cache = (async () => {
      const tracksDir = path.join(CONTENT_ROOT, "tracks");
      const files = await walkMdx(tracksDir);
      const records = await Promise.all(files.map(loadFile));

      // Cross-lesson invariant: no two lessons can share the same
      // (track, module, lesson) triple, and no two can share lessonCode.
      const tripleSeen = new Map<string, string>();
      const codeSeen = new Map<string, string>();
      for (const r of records) {
        const triple = `${r.frontmatter.track}/${r.frontmatter.module}/${r.frontmatter.lesson}`;
        if (tripleSeen.has(triple)) {
          throw new Error(
            `[content] Duplicate lesson key '${triple}' in ${path.relative(process.cwd(), r.filePath)} ` +
              `(already used by ${tripleSeen.get(triple)!}).`
          );
        }
        tripleSeen.set(triple, path.relative(process.cwd(), r.filePath));

        if (codeSeen.has(r.frontmatter.lessonCode)) {
          throw new Error(
            `[content] Duplicate lessonCode '${r.frontmatter.lessonCode}' in ` +
              `${path.relative(process.cwd(), r.filePath)} (already used by ${codeSeen.get(r.frontmatter.lessonCode)!}).`
          );
        }
        codeSeen.set(r.frontmatter.lessonCode, path.relative(process.cwd(), r.filePath));
      }

      return records;
    })();
  }
  return cache;
}

export async function findLesson(
  track: string,
  module: string,
  lesson: string
): Promise<LessonRecord | null> {
  const all = await loadAllLessons();
  return (
    all.find(
      (l) =>
        l.frontmatter.track === track &&
        l.frontmatter.module === module &&
        l.frontmatter.lesson === lesson
    ) ?? null
  );
}

export async function allLessonParams(): Promise<
  { track: string; module: string; lesson: string }[]
> {
  const all = await loadAllLessons();
  return all.map((l) => ({
    track: l.frontmatter.track,
    module: l.frontmatter.module,
    lesson: l.frontmatter.lesson,
  }));
}
