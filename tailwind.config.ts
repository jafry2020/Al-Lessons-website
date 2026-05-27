import type { Config } from "tailwindcss";

export default {
  content: [
    "./app/**/*.{ts,tsx}",
    "./src/**/*.{ts,tsx}",
    "./content/**/*.mdx",
  ],
  darkMode: ["class", '[data-theme="dark"]'],
  theme: {
    extend: {
      colors: {
        canvas: "rgb(var(--bg-canvas) / <alpha-value>)",
        surface: "rgb(var(--bg-surface) / <alpha-value>)",
        "surface-raised": "rgb(var(--bg-surface-raised) / <alpha-value>)",
        subtle: "rgb(var(--bg-subtle) / <alpha-value>)",
        "border-subtle": "rgb(var(--border-subtle) / <alpha-value>)",
        "border-strong": "rgb(var(--border-strong) / <alpha-value>)",
        "text-primary": "rgb(var(--text-primary) / <alpha-value>)",
        "text-secondary": "rgb(var(--text-secondary) / <alpha-value>)",
        "text-muted": "rgb(var(--text-muted) / <alpha-value>)",
        accent: {
          50: "rgb(var(--accent-50) / <alpha-value>)",
          100: "rgb(var(--accent-100) / <alpha-value>)",
          300: "rgb(var(--accent-300) / <alpha-value>)",
          500: "rgb(var(--accent-500) / <alpha-value>)",
          600: "rgb(var(--accent-600) / <alpha-value>)",
          700: "rgb(var(--accent-700) / <alpha-value>)",
        },
        success: "rgb(var(--success) / <alpha-value>)",
        warning: "rgb(var(--warning) / <alpha-value>)",
        danger: "rgb(var(--danger) / <alpha-value>)",
        info: "rgb(var(--info) / <alpha-value>)",
      },
      fontFamily: {
        sans: ['"Geist Sans"', "Inter", "system-ui", "sans-serif"],
        prose: ["Inter", "system-ui", "sans-serif"],
        mono: ['"JetBrains Mono"', "ui-monospace", "monospace"],
      },
      fontSize: {
        display: ["3.5rem", { lineHeight: "1.05", letterSpacing: "-0.02em", fontWeight: "600" }],
        h1: ["2.5rem", { lineHeight: "1.15", letterSpacing: "-0.015em", fontWeight: "600" }],
        h2: ["1.875rem", { lineHeight: "1.25", letterSpacing: "-0.01em", fontWeight: "600" }],
        h3: ["1.5rem", { lineHeight: "1.3", fontWeight: "600" }],
        h4: ["1.25rem", { lineHeight: "1.4", fontWeight: "600" }],
        "body-lg": ["1.125rem", { lineHeight: "1.65" }],
        body: ["1rem", { lineHeight: "1.6" }],
        "body-sm": ["0.875rem", { lineHeight: "1.55" }],
        caption: ["0.8125rem", { lineHeight: "1.5", letterSpacing: "0.01em" }],
        overline: ["0.75rem", { lineHeight: "1.3", letterSpacing: "0.08em", fontWeight: "600" }],
      },
      borderRadius: {
        sm: "6px",
        DEFAULT: "10px",
        md: "10px",
        lg: "14px",
        xl: "20px",
      },
      boxShadow: {
        sm: "0 1px 2px rgba(15, 15, 20, 0.04)",
        md: "0 2px 4px rgba(15, 15, 20, 0.04), 0 4px 12px rgba(15, 15, 20, 0.06)",
        lg: "0 4px 8px rgba(15, 15, 20, 0.04), 0 12px 32px rgba(15, 15, 20, 0.08)",
        focus: "0 0 0 3px rgba(124, 58, 237, 0.35)",
      },
      maxWidth: {
        prose: "70ch",
      },
      transitionTimingFunction: {
        out: "cubic-bezier(0.16, 1, 0.3, 1)",
        standard: "cubic-bezier(0.32, 0.72, 0, 1)",
      },
      keyframes: {
        shake: {
          "0%, 100%": { transform: "translateX(0)" },
          "25%": { transform: "translateX(-4px)" },
          "75%": { transform: "translateX(4px)" },
        },
        fadeUp: {
          "0%": { opacity: "0", transform: "translateY(8px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
      },
      animation: {
        shake: "shake 200ms ease-in-out 2",
        fadeUp: "fadeUp 400ms cubic-bezier(0.16, 1, 0.3, 1) both",
      },
    },
  },
  plugins: [],
} satisfies Config;
