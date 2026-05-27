import { type HTMLAttributes } from "react";
import { cn } from "@/lib/cn";

interface Props extends HTMLAttributes<HTMLDivElement> {
  interactive?: boolean;
}

export function Card({ className, interactive, ...rest }: Props) {
  return (
    <div
      className={cn(
        "bg-surface border border-border-subtle rounded-md p-6 shadow-sm",
        interactive &&
          "transition-all duration-[160ms] ease-standard hover:-translate-y-0.5 hover:border-border-strong hover:shadow-md cursor-pointer",
        className
      )}
      {...rest}
    />
  );
}
