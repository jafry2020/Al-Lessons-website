export function Footer() {
  return (
    <footer className="mt-24 border-t border-border-subtle">
      <div className="mx-auto grid max-w-[1200px] gap-8 px-6 py-12 text-body-sm md:grid-cols-4">
        <div>
          <div className="text-h4 font-semibold tracking-tight">Synapse</div>
          <p className="mt-2 max-w-xs text-text-secondary">
            University-grade Artificial Intelligence, Machine Learning, and Generative AI lessons.
            Interactive, visual, free.
          </p>
        </div>
        {[
          {
            title: "Learn",
            links: ["ML Engineer Path", "GenAI Builder Path", "Visualizations", "Q&A bank"],
          },
          { title: "Resources", links: ["Glossary", "Cheatsheets", "Reading list", "Changelog"] },
          { title: "About", links: ["Mission", "Authors", "Privacy", "Terms"] },
        ].map((col) => (
          <div key={col.title}>
            <div className="mb-3 text-overline uppercase text-text-muted">{col.title}</div>
            <ul className="space-y-2">
              {col.links.map((l) => (
                <li key={l}>
                  <a
                    href="#"
                    className="text-text-secondary transition-colors hover:text-text-primary"
                  >
                    {l}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
      <div className="border-t border-border-subtle">
        <div className="mx-auto max-w-[1200px] px-6 py-4 text-caption text-text-muted">
          © 2026 Synapse. Made for learners.
        </div>
      </div>
    </footer>
  );
}
