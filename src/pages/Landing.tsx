import { Link } from "react-router-dom";
import { ArrowRight, Brain, Sparkles, Zap, GraduationCap, BarChart3, Layers } from "lucide-react";
import { GradientDescentHero } from "@/components/viz/GradientDescentHero";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";

export function Landing() {
  return (
    <>
      {/* Hero */}
      <section className="border-b border-border-subtle">
        <div className="max-w-[1200px] mx-auto px-6 py-20 lg:py-28 grid lg:grid-cols-2 gap-12 items-center">
          <div className="animate-fadeUp">
            <Badge tone="accent" className="mb-5">
              <Sparkles size={11} /> 100 lessons · two tracks · free
            </Badge>
            <h1 className="text-display tracking-tight leading-[1.05]">
              Learn AI deeply, <br />
              <span className="text-accent-500">not just superficially.</span>
            </h1>
            <p className="mt-6 text-body-lg text-text-secondary max-w-prose">
              Synapse turns the curriculum behind MIT 6.S191, Stanford CS229, and
              Harvard CS50 AI into plain-language, interactive lessons. Every concept
              gets an analogy, a worked example, and a visualization you can play with.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link
                to="/tracks/ml-engineer/neural-networks/optimizers"
                className="h-12 px-5 inline-flex items-center gap-2 rounded-md bg-accent-500 text-white font-medium hover:bg-accent-600 transition-colors shadow-sm"
              >
                Start a sample lesson <ArrowRight size={16} />
              </Link>
              <a
                href="#tracks"
                className="h-12 px-5 inline-flex items-center gap-2 rounded-md border border-border-strong font-medium hover:bg-subtle transition-colors"
              >
                Browse tracks
              </a>
            </div>
            <div className="mt-10 flex flex-wrap gap-6 text-caption text-text-muted">
              <div className="flex items-center gap-2"><GraduationCap size={14}/> University-grade rigor</div>
              <div className="flex items-center gap-2"><Zap size={14}/> Interactive visualizations</div>
              <div className="flex items-center gap-2"><Brain size={14}/> No prerequisites</div>
            </div>
          </div>

          <div className="flex flex-col items-center lg:items-end gap-3">
            <GradientDescentHero />
            <div className="text-caption text-text-muted font-mono">
              ↑ live gradient descent — this is just a taste
            </div>
          </div>
        </div>
      </section>

      {/* Tracks */}
      <section id="tracks" className="max-w-[1200px] mx-auto px-6 py-20">
        <div className="flex items-end justify-between mb-10">
          <div>
            <div className="text-overline uppercase text-accent-600 mb-2">Two paths</div>
            <h2 className="text-h1 tracking-tight">Pick how you want to think about AI.</h2>
          </div>
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          <TrackCard
            icon={<BarChart3 size={20} />}
            badge="53 lessons · 9 modules"
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
            icon={<Layers size={20} />}
            badge="47 lessons · 10 modules"
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
      </section>

      {/* How it teaches */}
      <section className="bg-subtle border-y border-border-subtle">
        <div className="max-w-[1200px] mx-auto px-6 py-20">
          <div className="text-overline uppercase text-accent-600 mb-2">How Synapse teaches</div>
          <h2 className="text-h1 tracking-tight max-w-2xl">
            Every lesson, the same proven shape — eleven elements, no fluff.
          </h2>

          <div className="grid md:grid-cols-3 gap-4 mt-10">
            {[
              { t: "Concept", d: "Plain-language prose. Every technical term defined inline." },
              { t: "Analogy", d: "One accessible comparison that anchors the idea." },
              { t: "Worked example", d: "Numbers traced step-by-step — nothing waved away." },
              { t: "Visualization", d: "Play with it. Drag, slide, see the math respond." },
              { t: "Inline quiz", d: "Instant feedback. Wrong answers get explained." },
              { t: "Important Questions", d: "5–10 interview-grade Q&A per lesson, with pitfalls." },
            ].map((b) => (
              <Card key={b.t} className="bg-surface">
                <div className="text-overline uppercase text-text-muted mb-2">{b.t}</div>
                <p className="text-body text-text-secondary">{b.d}</p>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="max-w-[1200px] mx-auto px-6 py-20 text-center">
        <h2 className="text-h1 tracking-tight">Ready to dig in?</h2>
        <p className="mt-3 text-body-lg text-text-secondary max-w-xl mx-auto">
          Jump straight into <span className="text-text-primary">Optimizers</span> — a
          fully-built sample lesson with an interactive optimizer race, fill-in-the-blank
          challenge, and ten high-yield questions.
        </p>
        <div className="mt-7">
          <Link
            to="/tracks/ml-engineer/neural-networks/optimizers"
            className="h-12 px-6 inline-flex items-center gap-2 rounded-md bg-accent-500 text-white font-medium hover:bg-accent-600 transition-colors shadow-sm"
          >
            Open the sample lesson <ArrowRight size={16} />
          </Link>
        </div>
      </section>
    </>
  );
}

interface TrackProps {
  icon: React.ReactNode;
  badge: string;
  title: string;
  tagline: string;
  description: string;
  modules: string[];
}

function TrackCard({ icon, badge, title, tagline, description, modules }: TrackProps) {
  return (
    <Card interactive className="flex flex-col">
      <div className="flex items-center gap-3 mb-4">
        <div className="w-10 h-10 rounded-md bg-accent-50 text-accent-700 grid place-items-center">
          {icon}
        </div>
        <Badge>{badge}</Badge>
      </div>
      <h3 className="text-h3">{title}</h3>
      <p className="text-body text-text-secondary mt-1">{tagline}</p>
      <p className="text-body text-text-secondary mt-4">{description}</p>

      <ol className="mt-6 space-y-1.5 text-body-sm">
        {modules.map((m, i) => (
          <li key={m} className="flex gap-3 items-baseline text-text-secondary">
            <span className="font-mono text-caption text-text-muted w-6">
              {String(i + 1).padStart(2, "0")}
            </span>
            <span>{m}</span>
          </li>
        ))}
      </ol>

      <div className="mt-6 pt-6 border-t border-border-subtle flex items-center gap-2 text-body-sm font-medium text-accent-500 group-hover:gap-3 transition-all">
        Explore the path <ArrowRight size={14} />
      </div>
    </Card>
  );
}
