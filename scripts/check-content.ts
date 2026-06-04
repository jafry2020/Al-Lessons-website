#!/usr/bin/env node
/**
 * Standalone content sanity-check.
 *
 *   npm run check-content
 *
 * Walks every .mdx under content/, validates frontmatter against the Zod
 * schema and the tracks/modules registry, and surfaces every error at once
 * (rather than dying on the first one like `next build` would).
 *
 * Exits non-zero if anything is invalid. Wire-able into CI before `next build`
 * to fail fast on bad content.
 */

import { promises as fs } from "node:fs";
import path from "node:path";
import matter from "gray-matter";
import { lessonFrontmatterSchema } from "../src/lib/content";
import { expectedLabels, isValidModule, isValidTrack, TRACKS } from "../src/lib/content-registry";

const CONTENT_ROOT = path.join(process.cwd(), "content");

interface Problem {
  file: string;
  message: string;
}

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
    if (entry.isDirectory()) out.push(...(await walkMdx(full)));
    else if (entry.isFile() && entry.name.endsWith(".mdx")) out.push(full);
  }
  return out;
}

async function main() {
  // @mdx-js/mdx is pure ESM. Dynamic import from inside main() avoids tsx's
  // top-level-ESM resolution issues from a .ts entry point.
  const { compile: compileMdx } = (await import("@mdx-js/mdx")) as {
    compile: (input: string) => Promise<unknown>;
  };

  const files = await walkMdx(path.join(CONTENT_ROOT, "tracks"));
  if (files.length === 0) {
    console.log("[check-content] no .mdx files under content/tracks");
    return;
  }

  const problems: Problem[] = [];
  const tripleSeen = new Map<string, string>();
  const codeSeen = new Map<string, string>();

  for (const file of files) {
    const rel = path.relative(process.cwd(), file);
    const raw = await fs.readFile(file, "utf8");
    const { data, content: body } = matter(raw);

    // Compile MDX body. Catches `<5`, unescaped `{x: y}` in prose, malformed
    // JSX nesting — all of which compile cleanly via `next build` (which uses
    // SSR / `force-dynamic`) but explode at runtime when MDXRemote runs in
    // production. We compile here so CI fails before merge instead of letting
    // these reach Vercel.
    try {
      await compileMdx(body);
    } catch (e: unknown) {
      const err = e as {
        message?: string;
        place?: { line?: number; column?: number; start?: { line?: number; column?: number } };
      };
      const place = err.place;
      const line = place?.start?.line ?? place?.line;
      const col = place?.start?.column ?? place?.column;
      const where =
        line !== undefined ? ` (~line ${line}${col !== undefined ? `:${col}` : ""})` : "";
      problems.push({
        file: rel,
        message: `MDX compile error${where}: ${err.message?.slice(0, 240) ?? String(e)}`,
      });
    }

    const parsed = lessonFrontmatterSchema.safeParse(data);
    if (!parsed.success) {
      for (const issue of parsed.error.issues) {
        problems.push({
          file: rel,
          message: `${issue.path.join(".") || "(root)"}: ${issue.message}`,
        });
      }
      continue;
    }
    const fm = parsed.data;

    if (!isValidTrack(fm.track)) {
      problems.push({ file: rel, message: `unknown track '${fm.track}'` });
      continue;
    }
    if (!isValidModule(fm.track, fm.module)) {
      problems.push({
        file: rel,
        message: `unknown module '${fm.module}' for track '${fm.track}'`,
      });
      continue;
    }
    const expected = expectedLabels(fm.track, fm.module)!;
    if (fm.trackLabel !== expected.trackLabel) {
      problems.push({
        file: rel,
        message: `trackLabel '${fm.trackLabel}' should be '${expected.trackLabel}'`,
      });
    }
    if (fm.moduleLabel !== expected.moduleLabel) {
      problems.push({
        file: rel,
        message: `moduleLabel '${fm.moduleLabel}' should be '${expected.moduleLabel}'`,
      });
    }

    const triple = `${fm.track}/${fm.module}/${fm.lesson}`;
    if (tripleSeen.has(triple)) {
      problems.push({
        file: rel,
        message: `duplicate lesson key '${triple}' (also in ${tripleSeen.get(triple)})`,
      });
    } else {
      tripleSeen.set(triple, rel);
    }

    if (codeSeen.has(fm.lessonCode)) {
      problems.push({
        file: rel,
        message: `duplicate lessonCode '${fm.lessonCode}' (also in ${codeSeen.get(fm.lessonCode)})`,
      });
    } else {
      codeSeen.set(fm.lessonCode, rel);
    }
  }

  const totalLessons = files.length;
  const totalModules = TRACKS.reduce((n, t) => n + t.modules.length, 0);

  if (problems.length === 0) {
    console.log(
      `[check-content] OK — ${totalLessons} lesson${totalLessons === 1 ? "" : "s"} across ` +
        `${TRACKS.length} tracks / ${totalModules} modules.`
    );
    return;
  }

  console.error(`[check-content] ${problems.length} problem(s) found:\n`);
  const byFile = new Map<string, string[]>();
  for (const p of problems) {
    if (!byFile.has(p.file)) byFile.set(p.file, []);
    byFile.get(p.file)!.push(p.message);
  }
  for (const [file, msgs] of byFile) {
    console.error(`  ${file}`);
    for (const m of msgs) console.error(`    · ${m}`);
  }
  process.exit(1);
}

main().catch((err) => {
  console.error("[check-content] crashed:", err);
  process.exit(1);
});
