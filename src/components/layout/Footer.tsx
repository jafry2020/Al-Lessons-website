export function Footer() {
  return (
    <footer className="border-t border-border-subtle mt-24">
      <div className="max-w-[1200px] mx-auto px-6 py-12 grid md:grid-cols-4 gap-8 text-body-sm">
        <div>
          <div className="text-h4 font-semibold tracking-tight">Synapse</div>
          <p className="mt-2 text-text-secondary max-w-xs">
            University-grade Artificial Intelligence, Machine Learning, and Generative AI
            lessons. Interactive, visual, free.
          </p>
        </div>
        {[
          { title: "Learn", links: ["ML Engineer Path", "GenAI Builder Path", "Visualizations", "Q&A bank"] },
          { title: "Resources", links: ["Glossary", "Cheatsheets", "Reading list", "Changelog"] },
          { title: "About", links: ["Mission", "Authors", "Privacy", "Terms"] },
        ].map((col) => (
          <div key={col.title}>
            <div className="text-overline uppercase text-text-muted mb-3">{col.title}</div>
            <ul className="space-y-2">
              {col.links.map((l) => (
                <li key={l}>
                  <a href="#" className="text-text-secondary hover:text-text-primary transition-colors">
                    {l}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
      <div className="border-t border-border-subtle">
        <div className="max-w-[1200px] mx-auto px-6 py-4 text-caption text-text-muted">
          © 2026 Synapse. Made for learners.
        </div>
      </div>
    </footer>
  );
}
