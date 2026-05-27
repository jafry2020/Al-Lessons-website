"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Moon, Sun, BookOpen } from "lucide-react";
import { useTheme } from "@/hooks/useTheme";
import { cn } from "@/lib/cn";

const NAV_ITEMS = [
  { href: "/", label: "Tracks" },
  { href: "/", label: "Visualizations" },
  { href: "/", label: "Q&A" },
  { href: "/", label: "Glossary" },
];

export function TopNav() {
  const { theme, toggle } = useTheme();
  const pathname = usePathname();

  return (
    <header className="sticky top-0 z-40 backdrop-blur-md bg-canvas/80 border-b border-border-subtle">
      <div className="max-w-[1200px] mx-auto px-6 h-16 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2 group">
          <div className="w-7 h-7 rounded-md bg-accent-500 grid place-items-center text-white">
            <BookOpen size={16} strokeWidth={2} />
          </div>
          <span className="text-h4 font-semibold tracking-tight">Synapse</span>
        </Link>

        <nav className="hidden md:flex items-center gap-1">
          {NAV_ITEMS.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.label}
                href={item.href}
                className={cn(
                  "px-3 h-9 inline-flex items-center text-body-sm font-medium rounded-sm transition-colors",
                  isActive
                    ? "text-text-primary bg-subtle"
                    : "text-text-secondary hover:text-text-primary hover:bg-subtle"
                )}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="flex items-center gap-2">
          <button
            onClick={toggle}
            aria-label="Toggle theme"
            className="w-9 h-9 grid place-items-center rounded-sm text-text-secondary hover:bg-subtle hover:text-text-primary transition-colors"
          >
            {theme === "light" ? <Moon size={18} /> : <Sun size={18} />}
          </button>
          <button className="h-9 px-3 text-body-sm font-medium rounded-sm border border-border-strong hover:bg-subtle transition-colors">
            Sign in
          </button>
        </div>
      </div>
    </header>
  );
}
