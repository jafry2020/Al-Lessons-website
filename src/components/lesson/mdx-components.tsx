import type { MDXComponents } from "mdx/types";
import { GlossaryTerm } from "./GlossaryTerm";
import {
  AnalogyCallout,
  WorkedExample,
  PitfallsCallout,
} from "./Callouts";
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
  h2: (props) => <h2 className="text-h2 mt-12 mb-4" {...props} />,
  h3: (props) => <h3 className="text-h3 mt-10 mb-3" {...props} />,
  p: (props) => (
    <p className="text-body-lg text-text-secondary leading-relaxed my-4" {...props} />
  ),
  ul: (props) => (
    <ul
      className="my-4 space-y-2 text-body text-text-secondary list-disc pl-5"
      {...props}
    />
  ),
  ol: (props) => (
    <ol
      className="my-4 space-y-2 text-body text-text-secondary list-decimal pl-5"
      {...props}
    />
  ),
  strong: (props) => <strong className="text-text-primary font-semibold" {...props} />,
  code: (props) => (
    <code
      className="font-mono text-[0.9em] bg-subtle border border-border-subtle px-1.5 py-0.5 rounded-sm"
      {...props}
    />
  ),
  a: (props) => (
    <a
      className="text-accent-500 underline underline-offset-4 hover:text-accent-600"
      {...props}
    />
  ),
};
