import type { ReactNode } from "react";
import { Lightbulb, AlertTriangle, FlaskConical } from "lucide-react";

export function TldrCallout({ children }: { children: ReactNode }) {
  return (
    <section className="my-10 rounded-md border border-accent-100 bg-accent-50 p-6">
      <div className="mb-2 text-overline uppercase text-accent-700">TL;DR</div>
      <div className="text-body-lg leading-relaxed text-text-primary [&>p]:my-0 [&>p]:text-text-primary">
        {children}
      </div>
    </section>
  );
}

export function AnalogyCallout({ children }: { children: ReactNode }) {
  return (
    <aside className="my-6 border-l-[3px] border-accent-500 pl-5 text-body-lg italic text-text-secondary">
      <div className="mb-2 flex items-center gap-2 text-overline uppercase not-italic text-accent-600">
        <Lightbulb size={14} /> Analogy
      </div>
      {children}
    </aside>
  );
}

export function WorkedExample({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="my-8 rounded-md border border-border-subtle bg-subtle p-6">
      <div className="mb-2 flex items-center gap-2 text-overline uppercase text-text-secondary">
        <FlaskConical size={14} /> Worked example
      </div>
      <h4 className="mb-3 text-h4 font-semibold">{title}</h4>
      <div className="space-y-3 text-body leading-relaxed">{children}</div>
    </section>
  );
}

export function PitfallsCallout({ items }: { items: string[] }) {
  return (
    <aside className="my-8 border-l-[3px] border-warning pl-5">
      <div className="mb-2 flex items-center gap-2 text-overline uppercase text-warning">
        <AlertTriangle size={14} /> Common pitfalls
      </div>
      <ul className="list-disc space-y-2 pl-5 text-body text-text-secondary">
        {items.map((i, idx) => (
          <li key={idx}>{i}</li>
        ))}
      </ul>
    </aside>
  );
}
