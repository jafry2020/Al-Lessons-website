import { forwardRef, type ButtonHTMLAttributes } from "react";
import { cn } from "@/lib/cn";

type Variant = "primary" | "secondary" | "ghost" | "destructive" | "link";
type Size = "sm" | "md" | "lg";

interface Props extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
}

const variantStyles: Record<Variant, string> = {
  primary: "bg-accent-500 text-white hover:bg-accent-600 active:bg-accent-700 shadow-sm",
  secondary: "bg-surface text-text-primary border border-border-strong hover:bg-subtle",
  ghost: "bg-transparent text-text-primary hover:bg-subtle",
  destructive: "bg-danger text-white hover:opacity-90",
  link: "bg-transparent text-accent-500 hover:underline underline-offset-4 px-0",
};

const sizeStyles: Record<Size, string> = {
  sm: "h-8 px-3 text-body-sm rounded-sm",
  md: "h-10 px-4 text-body rounded-sm",
  lg: "h-12 px-5 text-body rounded-md",
};

export const Button = forwardRef<HTMLButtonElement, Props>(
  ({ className, variant = "primary", size = "md", ...rest }, ref) => (
    <button
      ref={ref}
      className={cn(
        "inline-flex items-center justify-center gap-2 font-medium transition-all duration-[160ms] ease-standard disabled:cursor-not-allowed disabled:opacity-50",
        variantStyles[variant],
        sizeStyles[size],
        className
      )}
      {...rest}
    />
  )
);
Button.displayName = "Button";
