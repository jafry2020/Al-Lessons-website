import Link from "next/link";
import { ArrowRight, Brain, Sparkles, Zap, GraduationCap, BarChart3, Layers } from "lucide-react";
import { GradientDescentHero } from "@/components/viz/GradientDescentHero";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";

export function Landing() {
  return (
    <>
      {/* Hero */}
      <section className="border-b border-border-subtle">
        <div className="mx-auto grid max-w-[1200px] items-center gap-12 px-6 py-20 lg:grid-cols-2 lg:py-28">
          <div className="animate-fadeUp">
            <Badge tone="accent" className="mb-5">
              <Sparkles size={11} /> 100 lessons · two tracks · free
            </Badge>
            <h1 className="text-display leading-[1.05] tracking-tight">
              Learn AI deeply, <br />
              <span className="text-accent-500">not just superficially.</span>
            </h1>
            <p className="mt-6 max-w-prose text-body-lg text-text-secondary">
              Synapse turns the curriculum behind MIT 6.S191, Stanford CS229, and Harvard CS50 AI
              into plain-language, interactive lessons. Every concept gets an analogy, a worked
              example, and a visualization you can play with.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link
                href="/tracks/ml-engineer/neural-networks/optimizers"
                className="inline-flex h-12 items-center gap-2 rounded-md bg-accent-500 px-5 font-medium text-white shadow-sm transition-colors hover:bg-accent-600"
              >
                Start a sample lesson <ArrowRight size={16} />
              </Link>
              <a
                href="#tracks"
                className="inline-flex h-12 items-center gap-2 rounded-md border border-border-strong px-5 font-medium transition-colors hover:bg-subtle"
              >
                Browse tracks
              </a>
            </div>
            <div className="mt-10 flex flex-wrap gap-6 text-caption text-text-muted">
              <div className="flex items-center gap-2">
                <GraduationCap size={14} /> University-grade rigor
              </div>
              <div className="flex items-center gap-2">
                <Zap size={14} /> Interactive visualizations
              </div>
              <div className="flex items-center gap-2">
                <Brain size={14} /> No prerequisites
              </div>
            </div>
          </div>

          <div className="flex flex-col items-center gap-3 lg:items-end">
            <GradientDescentHero />
            <div className="font-mono text-caption text-text-muted">
              ↑ live gradient descent — this is just a taste
            </div>
          </div>
        </div>
      </section>

      {/* Tracks */}
      <section id="tracks" className="mx-auto max-w-[1200px] px-6 py-20">
        <div className="mb-10 flex items-end justify-between">
          <div>
            <div className="mb-2 text-overline uppercase text-accent-600">Two paths</div>
            <h2 className="text-h1 tracking-tight">Pick how you want to think about AI.</h2>
          </div>
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          <TrackCard
            href="/tracks/ml-engineer"
            icon={<BarChart3 size={20} />}
            badge="ML Engineer Path · 9 modules"
            title="ML Engineer Path"
            tagline="Build models that learn from data."
            description="From linear regression to deep CNNs and MLOps. The track for people who want to ship trained models in production."
            modules={[
              "Foundations for ML",
              "Math & Stats Deeper",
              "Supervised Learning",
              "Unsupervised Learning",
              "Neural Networks",
              "Deep Learning Architectures",
              "NLP for ML Engineers",
              "Computer Vision",
              "MLOps & Deployment",
            ]}
          />
          <TrackCard
            href="/tracks/genai-builder"
            icon={<Layers size={20} />}
            badge="GenAI Builder Path · 10 modules"
            title="GenAI Builder Path"
            tagline="Build systems with foundation models."
            description="Transformers, LLMs, RAG, fine-tuning, diffusion, agents. The track for people who want to build the next generation of AI products."
            modules={[
              "Foundations for GenAI",
              "Language Modeling",
              "Transformers Deep Dive",
              "Large Language Models",
              "Prompt Engineering",
              "Retrieval-Augmented Generation",
              "Fine-tuning & Adaptation",
              "Diffusion & Multimodal",
              "Agents & Tool Use",
              "Evaluation, Safety & Ethics",
            ]}
          />
        </div>

        <div className="mt-8 text-center">
          <Link
            href="/tracks"
            className="inline-flex items-center gap-2 text-body-sm font-medium text-accent-500 hover:text-accent-600"
          >
            View the full catalog <ArrowRight size={14} />
          </Link>
        </div>
      </section>

      {/* How it teaches */}
      <section className="border-y border-border-subtle bg-subtle">
        <div className="mx-auto max-w-[1200px] px-6 py-20">
          <div className="mb-2 text-overline uppercase text-accent-600">How Synapse teaches</div>
          <h2 className="max-w-2xl text-h1 tracking-tight">
            Every lesson, the same proven shape — eleven elements, no fluff.
          </h2>

          <div className="mt-10 grid gap-4 md:grid-cols-3">
            {[
              { t: "Concept", d: "Plain-language prose. Every technical term defined inline." },
              { t: "Analogy", d: "One accessible comparison that anchors the idea." },
              { t: "Worked example", d: "Numbers traced step-by-step — nothing waved away." },
              { t: "Visualization", d: "Play with it. Drag, slide, see the math respond." },
              { t: "Inline quiz", d: "Instant feedback. Wrong answers get explained." },
              {
                t: "Important Questions",
                d: "5–10 interview-grade Q&A per lesson, with pitfalls.",
              },
            ].map((b) => (
              <Card key={b.t} className="bg-surface">
                <div className="mb-2 text-overline uppercase text-text-muted">{b.t}</div>
                <p className="text-body text-text-secondary">{b.d}</p>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="mx-auto max-w-[1200px] px-6 py-20 text-center">
        <h2 className="text-h1 tracking-tight">Ready to dig in?</h2>
        <p className="mx-auto mt-3 max-w-xl text-body-lg text-text-secondary">
          Jump straight into <span className="text-text-primary">Optimizers</span> — a fully-built
          sample lesson with an interactive optimizer race, fill-in-the-blank challenge, and ten
          high-yield questions.
        </p>
        <div className="mt-7">
          <Link
            href="/tracks/ml-engineer/neural-networks/optimizers"
            className="inline-flex h-12 items-center gap-2 rounded-md bg-accent-500 px-6 font-medium text-white shadow-sm transition-colors hover:bg-accent-600"
          >
            Open the sample lesson <ArrowRight size={16} />
          </Link>
        </div>
      </section>
    </>
  );
}

interface TrackProps {
  href: string;
  icon: React.ReactNode;
  badge: string;
  title: string;
  tagline: string;
  description: string;
  modules: string[];
}

function TrackCard({ href, icon, badge, title, tagline, description, modules }: TrackProps) {
  return (
    <Link
      href={href}
      className="group flex flex-col rounded-md border border-border-subtle bg-surface p-6 shadow-sm transition-all hover:-translate-y-0.5 hover:border-border-strong hover:shadow-md"
    >
      <div className="mb-4 flex items-center gap-3">
        <div className="grid h-10 w-10 place-items-center rounded-md bg-accent-50 text-accent-700">
          {icon}
        </div>
        <Badge>{badge}</Badge>
      </div>
      <h3 className="text-h3">{title}</h3>
      <p className="mt-1 text-body text-text-secondary">{tagline}</p>
      <p className="mt-4 text-body text-text-secondary">{description}</p>

      <ol className="mt-6 space-y-1.5 text-body-sm">
        {modules.map((m, i) => (
          <li key={m} className="flex items-baseline gap-3 text-text-secondary">
            <span className="w-6 font-mono text-caption text-text-muted">
              {String(i + 1).padStart(2, "0")}
            </span>
            <span>{m}</span>
          </li>
        ))}
      </ol>

      <div className="mt-6 flex items-center gap-2 border-t border-border-subtle pt-6 text-body-sm font-medium text-accent-500 transition-all group-hover:gap-3">
        Explore the path <ArrowRight size={14} />
      </div>
    </Link>
  );
}
