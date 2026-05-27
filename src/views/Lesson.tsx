"use client";

import Link from "next/link";
import { ChevronRight, Clock, BookOpen, ArrowRight, Copy } from "lucide-react";
import { GlossaryTerm } from "@/components/lesson/GlossaryTerm";
import { AnalogyCallout, WorkedExample, PitfallsCallout } from "@/components/lesson/Callouts";
import { InlineQuiz } from "@/components/lesson/InlineQuiz";
import { FillInBlankCode } from "@/components/lesson/FillInBlankCode";
import { ImportantQuestions, type ImportantQ } from "@/components/lesson/ImportantQuestions";
import { OptimizerRace } from "@/components/viz/OptimizerRace";
import { Badge } from "@/components/ui/Badge";

const SAMPLE_CODE = `# A from-scratch comparison of four optimizers
# updating a single parameter w to minimize loss = (w - 3) ** 2
import numpy as np

w_sgd, w_mom, w_rms, w_adam = -3.0, -3.0, -3.0, -3.0
v_mom = 0.0
s_rms = 0.0
m_adam, v_adam = 0.0, 0.0
lr, beta, rho, b1, b2, eps = 0.1, 0.9, 0.9, 0.9, 0.999, 1e-8

for t in range(1, 51):
    # Same loss: f(w) = (w - 3)**2, gradient = 2 * (w - 3)
    g_sgd  = 2 * (w_sgd  - 3)
    g_mom  = 2 * (w_mom  - 3)
    g_rms  = 2 * (w_rms  - 3)
    g_adam = 2 * (w_adam - 3)

    # SGD
    w_sgd -= lr * g_sgd

    # Momentum
    v_mom = beta * v_mom + g_mom
    w_mom -= lr * v_mom

    # RMSprop
    s_rms = rho * s_rms + (1 - rho) * g_rms ** 2
    w_rms -= lr * g_rms / (np.sqrt(s_rms) + eps)

    # Adam
    m_adam = b1 * m_adam + (1 - b1) * g_adam
    v_adam = b2 * v_adam + (1 - b2) * g_adam ** 2
    m_hat  = m_adam / (1 - b1 ** t)
    v_hat  = v_adam / (1 - b2 ** t)
    w_adam -= lr * m_hat / (np.sqrt(v_hat) + eps)

print(w_sgd, w_mom, w_rms, w_adam)  # all close to 3.0, at different speeds`;

const QUESTIONS: ImportantQ[] = [
  {
    question: "Why does momentum often converge faster than vanilla SGD?",
    shortAnswer:
      "Momentum accumulates a running average of past gradients, so consistent directions are amplified and oscillations are damped — letting it traverse ravines that pure SGD zigzags across.",
    detailed:
      "Pure SGD treats every step independently: each update is just −lr · g. In a long, narrow valley (a high curvature in one direction, low in another) SGD bounces back and forth across the walls of the valley while making slow progress along its length. Momentum updates a velocity v ← β·v + g and then steps with −lr · v. Because the across-valley components have alternating signs, they cancel inside v. The along-valley components have the same sign and accumulate. The net result: damped oscillation, faster forward motion. Typical β is 0.9, which corresponds to averaging roughly the last 10 gradients.",
    pitfalls: [
      "Momentum can overshoot near minima — sometimes you want to reduce β when fine-tuning.",
      "If you raise the learning rate without lowering β, the system can become unstable.",
      "Momentum is not the same as Nesterov momentum; Nesterov uses a 'look-ahead' gradient and has slightly different convergence properties.",
    ],
  },
  {
    question: "What problem do adaptive optimizers (RMSprop, Adam) solve that SGD-with-momentum doesn't?",
    shortAnswer:
      "They use a per-parameter effective learning rate, so parameters with large historical gradients take small steps and parameters with small gradients take larger steps.",
    detailed:
      "In a deep network, different parameters live on different scales — the gradient on an embedding might be 1000× the gradient on a late-layer bias. A single global learning rate forces you to pick a step size that works for the worst-scaled parameter, slowing everyone else down. RMSprop tracks E[g²] per parameter and divides the step by its square root; Adam combines that with momentum. The effect is that the optimizer 'normalizes' step sizes automatically. This is also why Adam is the default for training transformers — the gradient magnitudes vary wildly across positions, layers, and parameter types.",
    pitfalls: [
      "Adam can generalize slightly worse than SGD+momentum on CV tasks — well documented in the literature.",
      "Adam without weight decay decoupling (AdamW) interacts badly with L2 regularization.",
      "Very small ε values can make Adam unstable in mixed-precision training.",
    ],
  },
  {
    question: "What is bias correction in Adam, and why is it needed?",
    shortAnswer:
      "The moving averages m and v start at zero, so early in training they are biased toward zero. Dividing by (1 − βᵗ) corrects this bias, especially in the first few steps.",
    detailed:
      "Adam initializes m₀ = 0 and v₀ = 0. After one step, m₁ = (1 − β₁)·g₁ — only a small fraction of the true gradient. Without correction, the first few updates would be tiny and biased. The bias-corrected estimates m̂ = m / (1 − β₁ᵗ) and v̂ = v / (1 − β₂ᵗ) rescale the moving averages so that, in expectation, they match the true mean and variance of the gradients from step one. As t grows, βᵗ → 0 and the correction term vanishes — so it only matters at the start.",
    pitfalls: [
      "Forgetting bias correction is a common bug when reimplementing Adam from scratch.",
      "Bias correction interacts with learning-rate warmup — both fix early-training instability, but for different reasons.",
    ],
  },
  {
    question: "Why does the learning rate need to be tuned for each optimizer differently?",
    shortAnswer:
      "Different optimizers scale the gradient differently, so the same lr value means different effective step sizes. A good lr for SGD is often 10–100× too large for Adam.",
    detailed:
      "SGD updates by −lr · g. Adam updates by approximately −lr · sign(g) (because dividing by √v² ≈ |g|). That means Adam's effective step magnitude is roughly lr, regardless of gradient magnitude — while SGD's is lr·|g|. If you tune SGD to lr = 0.1, Adam at the same lr is usually exploding. A common rule of thumb: SGD lr ~ 0.01–0.1, Adam lr ~ 1e-4–1e-3 for deep networks, 1e-5 for fine-tuning large LLMs.",
    pitfalls: [
      "Copying a learning rate from a paper that used a different optimizer is a classic mistake.",
      "Effective lr also depends on batch size — larger batches generally allow larger lr (linear scaling rule for SGD).",
    ],
  },
  {
    question: "What is a learning-rate schedule, and why do we need one even with Adam?",
    shortAnswer:
      "A schedule changes lr over training — typically warmup then decay. Adam adapts step sizes per parameter but not over time; a schedule controls the global pace, which matters near convergence.",
    detailed:
      "Common schedules: linear warmup followed by cosine decay (the transformer-training default); step decay (drop lr by 10× at fixed epochs); ReduceLROnPlateau (drop when validation loss stalls). Warmup matters because Adam's bias-corrected estimates are noisy at step 1; starting with a tiny lr stabilizes the first few hundred steps. Decay matters because near the minimum, large steps overshoot — smaller steps let you settle in. Adam's per-parameter adaptation does not replace temporal scheduling.",
    pitfalls: [
      "Skipping warmup on transformers often causes training to diverge in the first few hundred steps.",
      "Decaying lr too aggressively can freeze learning before the model has fully fit.",
    ],
  },
  {
    question: "When would you prefer plain SGD with momentum over Adam?",
    shortAnswer:
      "Computer vision tasks (ResNet-style training), final fine-tuning, and any setting where slightly better generalization is worth slower convergence.",
    detailed:
      "Empirically, SGD+momentum often finds flatter minima than Adam, and flatter minima generalize better. For ImageNet-scale CNN training, most state-of-the-art runs still use SGD+momentum with cosine decay. Some practitioners also switch from Adam → SGD partway through training to combine fast convergence and good generalization (the 'SWATS' family of strategies). For NLP and any model with very heterogeneous gradient scales (i.e., transformers, RNNs), Adam/AdamW remains the safe default.",
    pitfalls: [
      "Using SGD on a transformer without careful tuning usually fails.",
      "'SGD generalizes better' is a statistical statement, not a guarantee for any single run.",
    ],
  },
  {
    question: "What is AdamW and why is it preferred over Adam + L2?",
    shortAnswer:
      "AdamW decouples weight decay from the adaptive gradient step, so regularization strength is independent of the per-parameter step size. Adam + L2 silently shrinks decay on large-gradient parameters.",
    detailed:
      "Adam + L2 adds the regularization term to the gradient before the moment estimates run — so the same weight ends up with a smaller effective decay if its accumulated v is large. That's not what you want regularization to do. AdamW computes the gradient update from the data loss alone, then applies w ← w − lr · λ · w as a separate step. The decay rate is now decoupled from the gradient statistics. For nearly every modern LLM training run, AdamW is the optimizer.",
    pitfalls: [
      "Some frameworks (older PyTorch) had `weight_decay` on Adam meaning L2 — looks identical, behaves differently.",
      "AdamW's decay constant is not directly comparable to Adam-with-L2's; tune them separately.",
    ],
  },
  {
    question: "How does gradient clipping interact with optimizers?",
    shortAnswer:
      "Clipping bounds gradient magnitude before the optimizer sees it. It's most useful for RNNs and transformers with attention, where occasional exploding gradients destabilize Adam.",
    detailed:
      "There are two variants. Value clipping: clamp each component to [−c, c]. Norm clipping (more common): if ||g||₂ > c, rescale g to have norm c. Norm clipping preserves direction, which matters for Adam — direction is what the moment estimates track. A typical setting for transformer training is clip_norm = 1.0. Without it, a single rare data point can produce a giant gradient that poisons Adam's running averages of v for many steps after.",
    pitfalls: [
      "Clipping by value distorts the gradient direction; almost always use norm clipping unless you have a specific reason.",
      "Clip threshold too small acts as a learning-rate cap and slows training silently.",
    ],
  },
  {
    question: "What's the difference between mini-batch SGD, full-batch GD, and stochastic GD?",
    shortAnswer:
      "Full batch uses all training data per step; pure stochastic uses one sample; mini-batch uses a small subset. Mini-batch is the practical default — it balances gradient noise with hardware efficiency.",
    detailed:
      "Full-batch gradient descent computes the exact gradient but is impossibly expensive on large datasets. Pure SGD with one sample is extremely noisy and underutilizes GPU parallelism. Mini-batch SGD (32–8192 samples) is a sweet spot: the gradient estimate is noisy enough to escape saddle points and shallow minima (a regularization-like effect), but accurate enough to make steady progress, and the batch fits the GPU's parallel arithmetic units. Modern 'SGD' in deep learning almost always means mini-batch SGD.",
    pitfalls: [
      "Very large batches need higher learning rates and/or longer warmup, or generalization drops.",
      "Calling it 'stochastic gradient descent' when you mean mini-batch is technically loose but universally understood.",
    ],
  },
  {
    question: "What does it mean for an optimizer to 'overshoot' a minimum?",
    shortAnswer:
      "The step size is too large: the update jumps from one side of the minimum to the other, sometimes ending up at a higher loss than where it started.",
    detailed:
      "On a quadratic loss f(w) = (w − w*)², a gradient step is w ← w − lr · 2(w − w*). If lr · 2 > 2, the update flips to the other side of w* further from it — divergence. If lr · 2 is between 1 and 2, it oscillates while converging. Momentum makes overshoot worse near minima (the velocity carries you past), which is why lr decay matters. The diagnostic in practice: loss curve that bounces, spikes, or NaNs — almost always lr too high.",
    pitfalls: [
      "An optimizer that 'overshoots and recovers' is fine; one that diverges to NaN is not.",
      "Don't confuse overshooting with the saddle-escape behavior of noisy SGD — both look like loss bumps in plots.",
    ],
  },
];

export function Lesson() {
  const copyCode = () => navigator.clipboard?.writeText(SAMPLE_CODE);

  return (
    <article className="max-w-[1200px] mx-auto px-6 py-10">
      {/* Breadcrumb */}
      <nav className="flex items-center gap-1.5 text-caption text-text-muted mb-6">
        <Link href="/" className="hover:text-text-primary">ML Engineer Path</Link>
        <ChevronRight size={12} />
        <span className="text-text-secondary">Module 4 · Neural Networks</span>
        <ChevronRight size={12} />
        <span className="text-text-primary">Lesson 5</span>
      </nav>

      <header className="mb-10 pb-10 border-b border-border-subtle">
        <Badge tone="accent" className="mb-4">
          A4.5 · Neural Networks
        </Badge>
        <h1 className="text-h1 tracking-tight max-w-3xl">
          Optimizers: how SGD, Momentum, RMSprop, and Adam actually behave
        </h1>
        <div className="mt-5 flex flex-wrap items-center gap-5 text-body-sm text-text-secondary">
          <span className="inline-flex items-center gap-2">
            <Clock size={14} /> 22 min read
          </span>
          <span className="inline-flex items-center gap-2">
            <BookOpen size={14} /> 10 important questions
          </span>
          <span>Prereqs: A4.4 Backpropagation</span>
        </div>
      </header>

      <div className="grid lg:grid-cols-[180px_minmax(0,1fr)] gap-10">
        {/* Section rail */}
        <aside className="hidden lg:block sticky top-24 self-start text-caption">
          <div className="text-overline uppercase text-text-muted mb-3">In this lesson</div>
          <ol className="space-y-2 border-l border-border-subtle">
            {[
              "TL;DR",
              "Objectives",
              "The core idea",
              "Analogy",
              "Worked example",
              "Optimizer race",
              "Reference code",
              "Code challenge",
              "Quick check",
              "Important Questions",
              "Pitfalls",
            ].map((s) => (
              <li key={s} className="pl-4 -ml-px border-l-2 border-transparent hover:border-accent-500 text-text-secondary hover:text-text-primary transition-colors">
                {s}
              </li>
            ))}
          </ol>
        </aside>

        {/* Lesson body */}
        <div className="max-w-prose">
          {/* TL;DR */}
          <section className="mb-10 p-6 rounded-md border border-accent-100 bg-accent-50">
            <div className="text-overline uppercase text-accent-700 mb-2">TL;DR</div>
            <p className="text-body-lg text-text-primary leading-relaxed">
              Every modern neural network is trained by an{" "}
              <em>optimizer</em> that decides how to turn gradients into parameter
              updates. SGD updates by the raw gradient. Momentum smooths the gradient
              over time. RMSprop and Adam additionally rescale each parameter's step
              size. They look similar in equations and behave very differently in
              practice — this lesson shows you exactly how.
            </p>
          </section>

          {/* Objectives */}
          <section className="mb-10">
            <h2 className="text-h2 mb-4">Learning objectives</h2>
            <ul className="space-y-2 text-body text-text-secondary list-disc pl-5">
              <li>Explain how SGD, Momentum, RMSprop, and Adam differ in one sentence each.</li>
              <li>Predict which optimizer will struggle on which kind of loss surface.</li>
              <li>Identify when to reach for AdamW vs. SGD+momentum in real projects.</li>
            </ul>
          </section>

          {/* Core idea */}
          <section className="mb-10">
            <h2 className="text-h2 mb-4">The core idea</h2>
            <p className="text-body-lg text-text-secondary leading-relaxed">
              Once{" "}
              <GlossaryTerm
                term="Backpropagation"
                definition="The algorithm that computes the gradient of the loss with respect to every parameter, by applying the chain rule layer-by-layer backwards through the network."
              >
                backpropagation
              </GlossaryTerm>{" "}
              has computed a{" "}
              <GlossaryTerm
                term="Gradient"
                definition="A vector pointing in the direction of steepest increase of a function. In training, we step in the opposite direction (−gradient) to decrease loss."
              >
                gradient
              </GlossaryTerm>{" "}
              for every parameter, we still have to decide how to use it. The naive
              choice — "subtract a small multiple of the gradient" — is{" "}
              <GlossaryTerm
                term="SGD (Stochastic Gradient Descent)"
                definition="The simplest optimizer. Each parameter is updated by w ← w − lr · g, where g is the gradient on a mini-batch. 'Stochastic' refers to the gradient being a noisy estimate computed from a subset of the data."
              >
                SGD
              </GlossaryTerm>
              . Everything else is a refinement: keep a memory of past gradients
              (momentum), or scale each parameter's step by how big its gradients have
              recently been (RMSprop, Adam).
            </p>

            <p className="text-body-lg text-text-secondary leading-relaxed mt-4">
              Why bother? Because real loss surfaces are not friendly bowls. They have
              long ravines, saddle points, and patches where the gradient is huge for
              one parameter and microscopic for another. The optimizer's job is to
              navigate that terrain quickly and without falling off.
            </p>
          </section>

          {/* Analogy */}
          <AnalogyCallout>
            Imagine four hikers descending the same mountain in fog. <strong>SGD</strong>{" "}
            steps in whatever direction feels steepest right now — it zigzags down a
            ridge. <strong>Momentum</strong> is a hiker on a bicycle: once it's rolling
            downhill, it keeps going even when the slope briefly flattens.{" "}
            <strong>RMSprop</strong> wears one big snowshoe and one small one — it takes
            tiny steps on icy patches where it's been slipping, and bigger steps on
            firm ground. <strong>Adam</strong> is the bicycle and the snowshoes.
          </AnalogyCallout>

          {/* Worked example */}
          <WorkedExample title="One step of Adam, by hand">
            <p>
              Suppose we have a single parameter <code>w = 2.0</code>, a gradient
              <code> g = 1.4</code>, and Adam at the very first step with hyper-parameters
              <code> β₁ = 0.9</code>, <code>β₂ = 0.999</code>, <code>lr = 0.1</code>.
            </p>
            <p>
              <strong>1. Update first moment (momentum):</strong> <br />
              <code>m₁ = 0.9 · 0 + 0.1 · 1.4 = 0.14</code>
            </p>
            <p>
              <strong>2. Update second moment (squared gradients):</strong> <br />
              <code>v₁ = 0.999 · 0 + 0.001 · 1.4² = 0.001 · 1.96 = 0.00196</code>
            </p>
            <p>
              <strong>3. Bias correction</strong> (at <code>t = 1</code>): <br />
              <code>m̂ = 0.14 / (1 − 0.9¹) = 0.14 / 0.1 = 1.4</code> <br />
              <code>v̂ = 0.00196 / (1 − 0.999¹) = 0.00196 / 0.001 = 1.96</code>
            </p>
            <p>
              <strong>4. Update:</strong> <br />
              <code>w ← 2.0 − 0.1 · 1.4 / (√1.96 + 1e-8) = 2.0 − 0.1 · 1.4 / 1.4 = 1.9</code>
            </p>
            <p className="text-text-secondary">
              Notice: with bias correction, the first step is essentially
              <code> lr · sign(g)</code> — a step of size 0.1, not a step proportional
              to <code>g</code>'s magnitude. That's the adaptive behavior that
              distinguishes Adam from SGD.
            </p>
          </WorkedExample>

          {/* The interactive viz */}
          <section className="mb-10">
            <h2 className="text-h2 mb-4">Optimizer race</h2>
            <p className="text-body-lg text-text-secondary leading-relaxed">
              Below, all four optimizers start from the same point and try to reach the
              minimum of the Beale function — a benchmark loss surface with a long,
              curving valley. Toggle optimizers on and off, adjust the learning rate,
              and click anywhere on the surface to relocate the starting point.
            </p>
            <OptimizerRace />
            <p className="text-body text-text-secondary leading-relaxed">
              Things to notice: with a small learning rate, SGD inches forward and may
              never reach the valley floor. Momentum gathers speed but can swing past
              the minimum. RMSprop's adaptive scaling helps it navigate the valley walls.
              Adam usually finishes first — but try a starting point near the steep
              edges (e.g. click in the top-left) and you'll see all four briefly struggle.
            </p>
          </section>

          {/* Reference code */}
          <section className="mb-10">
            <h2 className="text-h2 mb-4">Reference code</h2>
            <p className="text-body text-text-secondary mb-4">
              Below is a from-scratch implementation of all four optimizers on a simple
              1-D loss. Copy it into a notebook and play with the learning rate.
            </p>
            <div className="rounded-md overflow-hidden border border-border-subtle bg-surface-raised">
              <div className="flex items-center justify-between px-4 py-2 border-b border-border-subtle">
                <span className="text-overline uppercase text-text-muted">Python</span>
                <button
                  onClick={copyCode}
                  className="inline-flex items-center gap-1.5 text-caption text-text-secondary hover:text-text-primary"
                >
                  <Copy size={12} /> Copy
                </button>
              </div>
              <pre className="p-4 overflow-x-auto text-body-sm font-mono leading-relaxed text-text-primary">
                <code>{SAMPLE_CODE}</code>
              </pre>
            </div>
          </section>

          {/* Code challenge */}
          <section className="mb-10">
            <h2 className="text-h2 mb-4">Code challenge</h2>
            <FillInBlankCode
              prompt="Complete the Momentum update. The velocity v should be the running sum of gradients, weighted by β."
              before={"beta = 0.9\nfor t in range(steps):\n    g = grad(w)\n"}
              after={"    w = w - lr * v"}
              expected={["v = beta * v + g", "v=beta*v+g"]}
              hints={[
                "Momentum keeps a running quantity v that decays by β each step and accumulates the current gradient.",
                "The update has the form: v_new = β · v_old + g.",
              ]}
              solution={"v = beta * v + g"}
            />
          </section>

          {/* Inline quiz */}
          <section className="mb-10">
            <h2 className="text-h2 mb-4">Quick check</h2>
            <InlineQuiz
              question="Why does Adam's first step have size roughly equal to lr, regardless of how large the gradient is?"
              options={[
                { text: "Because it clips the gradient to lr before applying it." },
                { text: "Because of bias correction: at t=1, m̂ ≈ g and v̂ ≈ g², so the ratio m̂ / √v̂ ≈ sign(g).", correct: true },
                { text: "Because Adam ignores the gradient magnitude and only uses its sign." },
                { text: "Because the moving averages have not yet been initialized." },
              ]}
              explanation="After bias correction at the first step, m̂ = g and v̂ = g². The update becomes lr · g / |g| = lr · sign(g). Adam doesn't 'ignore' gradient magnitude — it normalizes by it via the second-moment estimate. That's the adaptive behavior."
            />
          </section>

          <ImportantQuestions items={QUESTIONS} />

          <PitfallsCallout
            items={[
              "Calling 'lr' the 'learning rate' across optimizers as if it means the same thing — it doesn't. Adam's effective step is roughly lr; SGD's is lr·|g|.",
              "Treating Adam as a universal default — it can generalize worse than SGD+momentum on CV tasks, even when training loss is identical.",
              "Forgetting bias correction. Without it, Adam's first few hundred updates are biased toward zero.",
              "Using Adam with L2 regularization instead of AdamW with decoupled decay — the regularization strength becomes scale-dependent.",
              "Cranking up the learning rate without lowering momentum β — the system can become unstable even when each piece looks correct.",
            ]}
          />

          <div className="mt-12 pt-8 border-t border-border-subtle flex items-center justify-between">
            <Link href="/" className="text-body-sm text-text-secondary hover:text-text-primary inline-flex items-center gap-1">
              ← Back to track
            </Link>
            <button className="h-11 px-5 inline-flex items-center gap-2 rounded-md bg-accent-500 text-white font-medium hover:bg-accent-600 transition-colors shadow-sm">
              Mark complete & continue <ArrowRight size={16} />
            </button>
          </div>
        </div>
      </div>
    </article>
  );
}
