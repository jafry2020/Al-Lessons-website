import type { ReactNode } from "react";
import { Lightbulb, AlertTriangle, FlaskConical } from "lucide-react";

export function AnalogyCallout({ children }: { children: ReactNode }) {
  return (
    <aside className="my-6 border-l-[3px] border-accent-500 pl-5 italic text-text-secondary text-body-lg">
      <div className="not-italic flex items-center gap-2 text-overline uppercase text-accent-600 mb-2">
        <Lightbulb size={14} /> Analogy
      </div>
      {children}
    </aside>
  );
}

export function WorkedExample({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="my-8 bg-subtle rounded-md p-6 border border-border-subtle">
      <div className="flex items-center gap-2 text-overline uppercase text-text-secondary mb-2">
        <FlaskConical size={14} /> Worked example
      </div>
      <h4 className="text-h4 font-semibold mb-3">{title}</h4>
      <div className="text-body leading-relaxed space-y-3">{children}</div>
    </section>
  );
}

export function PitfallsCallout({ items }: { items: string[] }) {
  return (
    <aside className="my-8 border-l-[3px] border-warning pl-5">
      <div className="flex items-center gap-2 text-overline uppercase text-warning mb-2">
        <AlertTriangle size={14} /> Common pitfalls
      </div>
      <ul className="space-y-2 text-body text-text-secondary list-disc pl-5">
        {items.map((i, idx) => (
          <li key={idx}>{i}</li>
        ))}
      </ul>
    </aside>
  );
}
