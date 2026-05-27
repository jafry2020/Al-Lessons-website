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

## File map

```
app/
├── layout.tsx                    Root layout, theme bootstrap, TopNav + Footer
├── page.tsx                      Landing (server, imports the Landing view)
├── globals.css                   Design tokens (light + dark) + Tailwind
├── icon.svg                      Favicon (auto-linked by Next.js)
└── tracks/ml-engineer/neural-networks/optimizers/page.tsx
                                  Sample lesson route (server, imports Lesson view)

src/
├── components/
│   ├── ui/                       Button, Card, Badge
│   ├── layout/                   TopNav (client), Footer
│   ├── lesson/                   GlossaryTerm, Callouts, InlineQuiz,
│   │                             HintLadder, FillInBlankCode, ImportantQuestions
│   └── viz/                      GradientDescentHero, OptimizerRace (both client)
├── views/                        Landing (server), Lesson (client)
├── hooks/useTheme.ts             Theme toggle (client)
└── lib/cn.ts                     clsx helper
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
