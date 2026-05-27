import { promises as fs } from "node:fs";
import path from "node:path";
import matter from "gray-matter";

const CONTENT_ROOT = path.join(process.cwd(), "content");

// ---------------------------------------------------------------------------
// Frontmatter schema
// ---------------------------------------------------------------------------

export interface ImportantQuestion {
  question: string;
  shortAnswer: string;
  detailed: string;
  pitfalls: string[];
}

export interface LessonFrontmatter {
  title: string;
  description?: string;
  track: string;
  module: string;
  lesson: string;
  moduleLabel: string;
  trackLabel: string;
  lessonCode: string;
  estMinutes: number;
  objectives: string[];
  prereqs?: string[];
  pitfalls?: string[];
  importantQuestions?: ImportantQuestion[];
}

export interface LessonRecord {
  frontmatter: LessonFrontmatter;
  body: string;
  href: string;
  filePath: string;
}

// ---------------------------------------------------------------------------
// Validation — fail loudly during build if a lesson is malformed.
// ---------------------------------------------------------------------------

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) throw new Error(`[content] ${message}`);
}

function validateFrontmatter(data: Record<string, unknown>, filePath: string): LessonFrontmatter {
  const where = path.relative(process.cwd(), filePath);
  assert(typeof data.title === "string", `${where}: missing 'title'`);
  assert(typeof data.track === "string", `${where}: missing 'track'`);
  assert(typeof data.module === "string", `${where}: missing 'module'`);
  assert(typeof data.lesson === "string", `${where}: missing 'lesson'`);
  assert(typeof data.moduleLabel === "string", `${where}: missing 'moduleLabel'`);
  assert(typeof data.trackLabel === "string", `${where}: missing 'trackLabel'`);
  assert(typeof data.lessonCode === "string", `${where}: missing 'lessonCode'`);
  assert(typeof data.estMinutes === "number", `${where}: missing 'estMinutes'`);
  assert(
    Array.isArray(data.objectives) && data.objectives.length > 0,
    `${where}: 'objectives' must be a non-empty array`
  );
  return data as unknown as LessonFrontmatter;
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
  const fm = validateFrontmatter(data, filePath);
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
      return Promise.all(files.map(loadFile));
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
