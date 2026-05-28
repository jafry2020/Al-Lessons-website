import type { MDXComponents } from "mdx/types";
import { GlossaryTerm } from "./GlossaryTerm";
import { TldrCallout, AnalogyCallout, WorkedExample, PitfallsCallout } from "./Callouts";
import { InlineQuiz } from "./InlineQuiz";
import { FillInBlankCode } from "./FillInBlankCode";
import { HintLadder } from "./HintLadder";
import { CodeBlock } from "./CodeBlock";
import { OptimizerRace } from "../viz/OptimizerRace";
import { GradientDescentHero } from "../viz/GradientDescentHero";
import { PolynomialFit } from "../viz/PolynomialFit";
import { ThresholdSlider } from "../viz/ThresholdSlider";
import { BayesCalculator } from "../viz/BayesCalculator";

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
  PolynomialFit,
  ThresholdSlider,
  BayesCalculator,

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

  // Tables — markdown's `| a | b |` syntax produces these. Without overrides
  // they render with browser defaults (no borders, cramped). Bring them into
  // the design system: bordered, padded, zebra-striped rows, header weight.
  table: (props) => (
    <div className="my-6 overflow-x-auto rounded-md border border-border-subtle">
      <table className="w-full border-collapse text-body-sm" {...props} />
    </div>
  ),
  thead: (props) => <thead className="bg-subtle text-text-primary" {...props} />,
  tbody: (props) => <tbody className="divide-y divide-border-subtle" {...props} />,
  tr: (props) => <tr className="even:bg-subtle/40" {...props} />,
  th: (props) => (
    <th
      className="border-b border-border-subtle px-4 py-2.5 text-left text-overline font-semibold uppercase text-text-primary"
      {...props}
    />
  ),
  td: (props) => <td className="px-4 py-2.5 align-top text-text-secondary" {...props} />,
};
