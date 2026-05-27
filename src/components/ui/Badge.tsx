import { type HTMLAttributes } from "react";
import { cn } from "@/lib/cn";

type Tone = "neutral" | "accent" | "success" | "warning";

interface Props extends HTMLAttributes<HTMLSpanElement> {
  tone?: Tone;
}

const tones: Record<Tone, string> = {
  neutral: "bg-subtle text-text-secondary border-border-subtle",
  accent: "bg-accent-50 text-accent-700 border-accent-100",
  success: "bg-success/10 text-success border-success/20",
  warning: "bg-warning/10 text-warning border-warning/20",
};

export function Badge({ className, tone = "neutral", ...rest }: Props) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 px-2 py-0.5 rounded-full border text-overline uppercase",
        tones[tone],
        className
      )}
      {...rest}
    />
  );
}
