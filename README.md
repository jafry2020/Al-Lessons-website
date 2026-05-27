# Synapse — AI Learning Platform

A polished, content- and visualization-driven learning platform for AI, ML, and
GenAI — built on the stack chosen in the design package.

## Stack

- **Next.js 15** (App Router) + React 18 + TypeScript
- **Tailwind CSS** with design tokens defined as CSS variables in `app/globals.css`
  (light + dark themes, hand-tuned dark palette)
- **Framer Motion** for micro-interactions
- **lucide-react** for icons
- No code-execution sandbox, no chatbot, no community surfaces (per MVP scope)

## Run it

```bash
npm install
npm run dev
```

Open http://localhost:3000.

| Route | Page |
| --- | --- |
| `/` | Landing page with live gradient-descent hero |
| `/tracks/ml-engineer/neural-networks/optimizers` | Sample lesson: A4.5 Optimizers |

## Other scripts

```bash
npm run build       # Production build
npm run start       # Run the production build
npm run typecheck   # TypeScript only, no emit
```

## Authoring lessons

Lessons live as `.mdx` files in `content/tracks/{track}/{module}/{lesson}.mdx`.
Each file is:

1. **Frontmatter** — typed, validated at load time. Provides metadata (title,
   est-minutes, prereqs, learning objectives) and structured blocks
   (`pitfalls`, `importantQuestions`) that render outside the MDX body via the
   `LessonLayout` shell.
2. **MDX body** — prose with embedded React shortcodes. Available components
   (no import needed):
   - `<GlossaryTerm term="…" definition="…">…</GlossaryTerm>` — hover tooltip
   - `<AnalogyCallout>…</AnalogyCallout>`
   - `<WorkedExample title="…">…</WorkedExample>`
   - `<CodeBlock language="Python">{`…code…`}</CodeBlock>` — static, copy-able
   - `<InlineQuiz question="…" options={[…]} explanation="…" />`
   - `<FillInBlankCode prompt="…" before="…" after="…" expected={[…]} hints={[…]} solution="…" />`
   - `<HintLadder hints={[…]} solution="…" />`
   - `<OptimizerRace />`, `<GradientDescentHero />` — visualizations

To add a new lesson: create the .mdx file with the required frontmatter, and
the dynamic route `/tracks/[track]/[module]/[lesson]` will render it on the
next build. No code changes needed.

## File map

```
app/
├── layout.tsx                    Root layout, theme bootstrap, TopNav + Footer
├── page.tsx                      Landing route (server)
├── globals.css                   Design tokens (light + dark) + Tailwind
├── icon.svg                      Favicon (auto-linked by Next.js)
└── tracks/[track]/[module]/[lesson]/page.tsx
                                  Dynamic lesson route — loads MDX, renders
                                  through LessonLayout + MDXRemote

content/
└── tracks/{track}/{module}/{lesson}.mdx
                                  All lesson content

src/
├── components/
│   ├── ui/                       Button, Card, Badge
│   ├── layout/                   TopNav (client), Footer
│   ├── lesson/                   LessonLayout, GlossaryTerm, Callouts,
│   │                             InlineQuiz, HintLadder, FillInBlankCode,
│   │                             CodeBlock, ImportantQuestions,
│   │                             mdx-components (the shortcode map)
│   └── viz/                      GradientDescentHero, OptimizerRace
├── views/Landing.tsx             Landing page composition
├── lib/
│   ├── content.ts                MDX loader + frontmatter validation
│   └── cn.ts                     clsx helper
└── hooks/useTheme.ts             Theme toggle
```

Client components are marked with `"use client"` at the top of the file. Everything
else is a server component by default and renders to static HTML where possible.

## Scope decisions baked in

- **Two tracks**, fully independent: ML Engineer Path, GenAI Builder Path.
- **No code execution.** Code blocks are static + copy-able. Fill-in-the-blank
  challenges grade by string match.
- **No community.** Doubt-clarification via glossary tooltips, tiered hint
  ladders, worked solutions, and the curated Q&A bank.
- **No chatbot / AI tutor.** Anywhere.
- **Free at MVP.** No paywall components.
