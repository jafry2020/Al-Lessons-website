# Synapse — AI Learning Platform Prototype

A working prototype of an interactive AI/ML/GenAI learning platform.
This repo contains the deliverable from D5 of the design package:

- A polished marketing **homepage** with a live gradient-descent visualization.
- One **fully built sample lesson** — *Optimizers (A4.5)* — demonstrating every
  element of the lesson template: glossary tooltips, analogy, worked example,
  interactive visualization, static code block, fill-in-the-blank code
  challenge with tiered hint ladder, inline quiz, ten Important Questions, and
  pitfalls callout.
- The full design system applied: violet accent, Geist/Inter/JetBrains Mono
  typography, dark & light themes, semantic color tokens, accessible focus
  states.

## Run it

```bash
npm install
npm run dev
```

Then open http://localhost:5173.

- `/` — landing page
- `/tracks/ml-engineer/neural-networks/optimizers` — sample lesson

## Stack

This prototype uses the stack chosen in D3 (minus what isn't needed to demo):

- **Vite + React 18 + TypeScript** — kept simple for a single-package preview;
  the production target is **Next.js 15 (App Router)** with the same component
  layer.
- **Tailwind CSS** with all design tokens defined as CSS variables in
  `src/styles/globals.css` (mapped to Tailwind via `tailwind.config.ts`).
- **Framer Motion** + custom keyframes for micro-interactions.
- **lucide-react** for icons.
- **react-router-dom** for the two routes.

No code execution sandbox, no chatbot, no community surfaces — per project scope.

## File map

```
src/
├── App.tsx                       Route wiring
├── main.tsx                      React entry
├── styles/globals.css            Design tokens + base styles (light & dark)
├── hooks/useTheme.ts             Dark/light toggle
├── lib/cn.ts                     clsx helper
├── components/
│   ├── ui/                       Button, Badge, Card primitives
│   ├── layout/                   TopNav, Footer
│   ├── lesson/                   GlossaryTerm, Callouts, InlineQuiz,
│   │                             FillInBlankCode, HintLadder,
│   │                             ImportantQuestions
│   └── viz/                      GradientDescentHero, OptimizerRace
└── pages/
    ├── Landing.tsx               Homepage
    └── Lesson.tsx                Sample lesson (A4.5 Optimizers)
```
