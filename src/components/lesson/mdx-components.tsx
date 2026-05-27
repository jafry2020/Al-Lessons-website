import type { MDXComponents } from "mdx/types";
import { GlossaryTerm } from "./GlossaryTerm";
import { TldrCallout, AnalogyCallout, WorkedExample, PitfallsCallout } from "./Callouts";
import { InlineQuiz } from "./InlineQuiz";
import { FillInBlankCode } from "./FillInBlankCode";
import { HintLadder } from "./HintLadder";
import { CodeBlock } from "./CodeBlock";
import { OptimizerRace } from "../viz/OptimizerRace";
import { GradientDescentHero } from "../viz/GradientDescentHero";

/**
 * Components available inside any .mdx lesson file.
 * Authors can write <GlossaryTerm term="…" definition="…">…</GlossaryTerm>,
 * <AnalogyCallout>…</AnalogyCallout>, etc., directly in MDX.
 */
export const mdxComponents: MDXComponents = {
  // Lesson shortcodes
  GlossaryTerm,
  TldrCallout,
  AnalogyCallout,
  WorkedExample,
  PitfallsCallout,
  InlineQuiz,
  FillInBlankCode,
  HintLadder,
  CodeBlock,

  // Visualizations
  OptimizerRace,
  GradientDescentHero,

  // Markdown overrides: align native MD output with the design system.
  h2: (props) => <h2 className="mb-4 mt-12 text-h2" {...props} />,
  h3: (props) => <h3 className="mb-3 mt-10 text-h3" {...props} />,
  p: (props) => <p className="my-4 text-body-lg leading-relaxed text-text-secondary" {...props} />,
  ul: (props) => (
    <ul className="my-4 list-disc space-y-2 pl-5 text-body text-text-secondary" {...props} />
  ),
  ol: (props) => (
    <ol className="my-4 list-decimal space-y-2 pl-5 text-body text-text-secondary" {...props} />
  ),
  strong: (props) => <strong className="font-semibold text-text-primary" {...props} />,
  code: (props) => (
    <code
      className="rounded-sm border border-border-subtle bg-subtle px-1.5 py-0.5 font-mono text-[0.9em]"
      {...props}
    />
  ),
  a: (props) => (
    <a className="text-accent-500 underline underline-offset-4 hover:text-accent-600" {...props} />
  ),
};
