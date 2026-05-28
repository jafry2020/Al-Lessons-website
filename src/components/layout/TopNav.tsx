"use client";

import type { ReactNode } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Moon, Sun, BookOpen } from "lucide-react";
import { useTheme } from "@/hooks/useTheme";
import { cn } from "@/lib/cn";

const NAV_ITEMS = [
  { href: "/tracks", label: "Tracks" },
  { href: "/", label: "Visualizations" },
  { href: "/", label: "Q&A" },
  { href: "/glossary", label: "Glossary" },
];

interface Props {
  // Right-side account slot — the layout passes either a <UserMenu/> (when
  // signed in) or a sign-in link. Keeping it as a prop lets TopNav stay a
  // client component while the session lookup happens server-side.
  accountSlot: ReactNode;
}

export function TopNav({ accountSlot }: Props) {
  const { theme, toggle } = useTheme();
  const pathname = usePathname();

  return (
    <header className="sticky top-0 z-40 border-b border-border-subtle bg-canvas/80 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-[1200px] items-center justify-between px-6">
        <Link href="/" className="group flex items-center gap-2">
          <div className="grid h-7 w-7 place-items-center rounded-md bg-accent-500 text-white">
            <BookOpen size={16} strokeWidth={2} />
          </div>
          <span className="text-h4 font-semibold tracking-tight">Synapse</span>
        </Link>

        <nav className="hidden items-center gap-1 md:flex">
          {NAV_ITEMS.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.label}
                href={item.href}
                className={cn(
                  "inline-flex h-9 items-center rounded-sm px-3 text-body-sm font-medium transition-colors",
                  isActive
                    ? "bg-subtle text-text-primary"
                    : "text-text-secondary hover:bg-subtle hover:text-text-primary"
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
            className="grid h-9 w-9 place-items-center rounded-sm text-text-secondary transition-colors hover:bg-subtle hover:text-text-primary"
          >
            {theme === null ? (
              <span aria-hidden className="block h-[18px] w-[18px]" />
            ) : theme === "light" ? (
              <Moon size={18} />
            ) : (
              <Sun size={18} />
            )}
          </button>
          {accountSlot}
        </div>
      </div>
    </header>
  );
}
