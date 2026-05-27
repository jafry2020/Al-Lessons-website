import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { MDXRemote } from "next-mdx-remote/rsc";
import { findLesson, allLessonParams } from "@/lib/content";
import { LessonLayout } from "@/components/lesson/LessonLayout";
import { mdxComponents } from "@/components/lesson/mdx-components";

interface Params {
  track: string;
  module: string;
  lesson: string;
}

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

  return (
    <LessonLayout lesson={lesson}>
      <MDXRemote source={lesson.body} components={mdxComponents} />
    </LessonLayout>
  );
}
