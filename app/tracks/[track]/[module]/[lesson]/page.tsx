import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { MDXRemote } from "next-mdx-remote/rsc";
import { findLesson, allLessonParams } from "@/lib/content";
import { LessonLayout } from "@/components/lesson/LessonLayout";
import { getLessonProgress, trackLessonVisit } from "@/lib/lesson-actions";
import { mdxComponents } from "@/components/lesson/mdx-components";

interface Params {
  track: string;
  module: string;
  lesson: string;
}

// The lesson MDX body itself could be pre-rendered, but the page also reads
// the viewer's progress and upserts a lastVisitedAt row — both per-request.
// Render dynamically until Next 15's stable PPR support lets us mix.
export const dynamic = "force-dynamic";

export async function generateStaticParams(): Promise<Params[]> {
  return allLessonParams();
}

export async function generateMetadata({ params }: { params: Promise<Params> }): Promise<Metadata> {
  const p = await params;
  const lesson = await findLesson(p.track, p.module, p.lesson);
  if (!lesson) return {};
  return {
    title: lesson.frontmatter.title,
    description: lesson.frontmatter.description,
  };
}

export default async function LessonPage({ params }: { params: Promise<Params> }) {
  const p = await params;
  const lesson = await findLesson(p.track, p.module, p.lesson);
  if (!lesson) notFound();

  // Side effects on lesson view (no-ops if signed out).
  await trackLessonVisit({ track: p.track, module: p.module, lesson: p.lesson });
  const progress = await getLessonProgress({
    track: p.track,
    module: p.module,
    lesson: p.lesson,
  });

  return (
    <LessonLayout lesson={lesson} progress={progress}>
      <MDXRemote
        source={lesson.body}
        components={mdxComponents}
        // next-mdx-remote@6 defaults to stripping `{...}` expressions for
        // user-submitted MDX safety. Our MDX is author-trusted (lives in the
        // repo), and several shortcodes — InlineQuiz, FillInBlankCode,
        // HintLadder, CodeBlock — depend on expression-style props
        // (`hints={[...]}`, children={`...`}). Disable the block; the
        // separate blockDangerousJS=true default still blocks eval/process/
        // Function access.
        options={{ mdxOptions: {}, blockJS: false }}
      />
    </LessonLayout>
  );
}
