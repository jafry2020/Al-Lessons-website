import { type HTMLAttributes } from "react";
import { cn } from "@/lib/cn";

interface Props extends HTMLAttributes<HTMLDivElement> {
  interactive?: boolean;
}

export function Card({ className, interactive, ...rest }: Props) {
  return (
    <div
      className={cn(
        "rounded-md border border-border-subtle bg-surface p-6 shadow-sm",
        interactive &&
          "cursor-pointer transition-all duration-[160ms] ease-standard hover:-translate-y-0.5 hover:border-border-strong hover:shadow-md",
        className
      )}
      {...rest}
    />
  );
}
