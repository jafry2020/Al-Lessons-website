/**
 * Single source of truth for tracks and modules.
 *
 * Every lesson's frontmatter `track` and `module` slugs must appear in this
 * registry — if they don't, the content loader rejects the lesson at build
 * time with a clear error pointing at the offending slug.
 *
 * Why a hand-maintained registry instead of inferring from MDX folders:
 *   - Ordering: lessons within a module follow `lessonCode` ordering, but
 *     modules within a track and tracks themselves need an explicit order
 *     that's independent of folder names.
 *   - Labels: human-readable names (with em-dashes, ampersands, punctuation)
 *     don't make great slugs. We want both.
 *   - Catalog completeness: the registry lists modules even before any lesson
 *     has been authored for them, so /tracks shows the full plan from day one.
 */

export interface ModuleEntry {
  slug: string;
  label: string;
}

export interface TrackEntry {
  slug: string;
  label: string;
  tagline: string;
  description: string;
  modules: ModuleEntry[];
}

export const TRACKS: TrackEntry[] = [
  {
    slug: "ml-engineer",
    label: "ML Engineer Path",
    tagline: "Build models that learn from data.",
    description:
      "From linear regression to deep CNNs and MLOps. The track for people who want to ship trained models in production.",
    modules: [
      { slug: "foundations", label: "Module 0 · Foundations for ML" },
      { slug: "math-stats", label: "Module 1 · Math & Stats Deeper" },
      { slug: "supervised", label: "Module 2 · Supervised Learning" },
      { slug: "unsupervised", label: "Module 3 · Unsupervised Learning" },
      { slug: "neural-networks", label: "Module 4 · Neural Networks" },
      { slug: "deep-architectures", label: "Module 5 · Deep Learning Architectures" },
      { slug: "nlp", label: "Module 6 · NLP for ML Engineers" },
      { slug: "vision", label: "Module 7 · Computer Vision" },
      { slug: "mlops", label: "Module 8 · MLOps & Deployment" },
      { slug: "capstone", label: "Capstone · End-to-end ML system design" },
    ],
  },
  {
    slug: "system-design",
    label: "System Design Foundations",
    tagline: "Build apps that survive scale, faults, and time.",
    description:
      "A beginner-friendly tour of data-intensive applications based on Martin Kleppmann's DDIA (O'Reilly, 2017). Reliability, replication, partitioning, transactions, and the hard problems of distributed systems — made tangible through hands-on simulators.",
    modules: [
      { slug: "reliability", label: "Module 1 · Reliability, Scalability & Maintainability" },
      { slug: "data-models", label: "Module 2 · Data Models & Query Languages" },
      { slug: "storage", label: "Module 3 · Storage & Retrieval" },
      { slug: "encoding", label: "Module 4 · Encoding & Evolution" },
      { slug: "replication", label: "Module 5 · Replication" },
      { slug: "partitioning", label: "Module 6 · Partitioning" },
      { slug: "transactions", label: "Module 7 · Transactions" },
      { slug: "distributed", label: "Module 8 · Distributed Systems" },
    ],
  },
  {
    slug: "genai-builder",
    label: "GenAI Builder Path",
    tagline: "Build systems with foundation models.",
    description:
      "Transformers, LLMs, RAG, fine-tuning, diffusion, agents. The track for people who want to build the next generation of AI products.",
    modules: [
      { slug: "foundations", label: "Module 0 · Foundations for GenAI" },
      { slug: "language-modeling", label: "Module 1 · Language Modeling Foundations" },
      { slug: "transformers", label: "Module 2 · Transformers Deep Dive" },
      { slug: "llms", label: "Module 3 · Large Language Models" },
      { slug: "prompt-engineering", label: "Module 4 · Prompt Engineering" },
      { slug: "rag", label: "Module 5 · Retrieval-Augmented Generation" },
      { slug: "fine-tuning", label: "Module 6 · Fine-tuning & Adaptation" },
      { slug: "diffusion-multimodal", label: "Module 7 · Diffusion & Multimodal" },
      { slug: "agents", label: "Module 8 · Agents & Tool Use" },
      { slug: "evaluation-safety", label: "Module 9 · Evaluation, Safety & Ethics" },
      { slug: "capstone", label: "Capstone · Build a RAG-powered assistant" },
    ],
  },
];

// ---------------------------------------------------------------------------
// Lookup helpers
// ---------------------------------------------------------------------------

const trackBySlug = new Map(TRACKS.map((t) => [t.slug, t] as const));

export function getTrack(slug: string): TrackEntry | undefined {
  return trackBySlug.get(slug);
}

export function getModule(trackSlug: string, moduleSlug: string): ModuleEntry | undefined {
  return getTrack(trackSlug)?.modules.find((m) => m.slug === moduleSlug);
}

export function isValidTrack(slug: string): boolean {
  return trackBySlug.has(slug);
}

export function isValidModule(trackSlug: string, moduleSlug: string): boolean {
  return !!getModule(trackSlug, moduleSlug);
}

/**
 * The expected label for a (track, module) pair. Lessons must declare a
 * `moduleLabel` and `trackLabel` that matches the registry — keeps prose
 * across the site consistent.
 */
export function expectedLabels(
  trackSlug: string,
  moduleSlug: string
): { trackLabel: string; moduleLabel: string } | null {
  const t = getTrack(trackSlug);
  const m = getModule(trackSlug, moduleSlug);
  if (!t || !m) return null;
  return { trackLabel: t.label, moduleLabel: m.label };
}
