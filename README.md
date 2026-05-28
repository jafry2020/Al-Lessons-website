# Synapse — AI Learning Platform

A polished, content- and visualization-driven learning platform for AI, ML, and
GenAI — built on the stack chosen in the design package.

## Stack

- **Next.js 15** (App Router) + React 19 + TypeScript
- **Auth.js v5** with GitHub OAuth (Prisma adapter, database sessions)
- **Postgres** (Neon) + **Prisma** ORM
- **Tailwind CSS** with design tokens defined as CSS variables in `app/globals.css`
  (light + dark themes, hand-tuned dark palette)
- **Framer Motion** for micro-interactions
- **lucide-react** for icons
- No code-execution sandbox, no chatbot, no community surfaces (per MVP scope)

## Setup

One-time setup before running locally:

```bash
npm install --legacy-peer-deps
cp .env.example .env.local
# fill in .env.local — see below for each value
npx prisma generate
npx prisma migrate dev --name init   # creates tables on first run
```

### Environment variables

All values live in `.env.local` (gitignored). See `.env.example` for the
full list with comments. You'll need:

| Variable                                   | How to get it                                                                                                                                               |
| ------------------------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `DATABASE_URL`                             | Sign up at https://neon.tech (free), create a project, copy the **Pooled** connection string.                                                               |
| `AUTH_SECRET`                              | Run `openssl rand -base64 33` or paste any long random string.                                                                                              |
| `AUTH_TRUST_HOST`                          | Set to `true` for local dev.                                                                                                                                |
| `GITHUB_CLIENT_ID`, `GITHUB_CLIENT_SECRET` | Create an OAuth App at https://github.com/settings/developers. Homepage `http://localhost:3000`, callback `http://localhost:3000/api/auth/callback/github`. |

## Run it

```bash
npm run dev
```

Open http://localhost:3000.

| Route                                            | Page                                         |
| ------------------------------------------------ | -------------------------------------------- |
| `/`                                              | Landing page with live gradient-descent hero |
| `/tracks/ml-engineer/neural-networks/optimizers` | Sample lesson: A4.5 Optimizers               |

## Other scripts

```bash
npm run build           # Production build
npm run start           # Run the production build
npm run typecheck       # TypeScript only, no emit
npm run check-content   # Validate every .mdx against the Zod schema + registry
npm run lint            # ESLint
npm run format          # Prettier write
```

## Deploying to Vercel (preview-per-PR workflow)

This connects the repo to Vercel so every push to `main` deploys to production
and every PR gets its own preview URL.

1. Go to https://vercel.com/new and sign in with GitHub.
2. **Import Git Repository** → pick `jafry2020/Al-Lessons-website`.
3. Framework preset: **Next.js** (auto-detected). Root directory: leave as is.
4. **Environment Variables** — paste the same names from `.env.local`:
   - `DATABASE_URL` — your Neon **production** connection string (use the
     non-pooled variant for Prisma migrations, the pooled one for the runtime).
     Easiest: just use the pooled one for both.
   - `AUTH_SECRET` — generate a fresh one for production, do **not** reuse
     your local value.
   - `AUTH_TRUST_HOST` — leave unset; Vercel sets this implicitly.
   - `GITHUB_CLIENT_ID`, `GITHUB_CLIENT_SECRET` — see step 5.
5. Create a **second GitHub OAuth App** for production:
   - https://github.com/settings/developers → New OAuth App
   - Homepage URL: `https://<your-vercel-project>.vercel.app`
   - Callback URL: `https://<your-vercel-project>.vercel.app/api/auth/callback/github`
   - Use these credentials for the Vercel env vars. (Keep the local-dev one
     separate so callbacks don't collide.)
6. Click **Deploy**. After the first deploy succeeds, run the schema
   migration against the production DB once:
   ```bash
   DATABASE_URL="<your prod connection string>" npx prisma migrate deploy
   ```
   You can do this locally — `prisma migrate deploy` only runs migrations
   that haven't been applied yet, so it's safe to re-run.

From now on:

- Every push to `main` → production deploy at your `*.vercel.app` URL.
- Every PR → its own preview URL posted as a check on the PR. Click through
  to review content changes before merging.

CI (`.github/workflows/ci.yml`) runs `lint → typecheck → check-content → build`
on every PR and push to `main`, with placeholder env values. A failing CI
blocks the merge.

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
