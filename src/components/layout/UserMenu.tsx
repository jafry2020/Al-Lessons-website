"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { LogOut, LayoutDashboard, User as UserIcon } from "lucide-react";

interface Props {
  user: { name?: string | null; email?: string | null; image?: string | null };
  signOutAction: () => Promise<void>;
}

export function UserMenu({ user, signOutAction }: Props) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open]);

  const initials =
    (user.name ?? user.email ?? "?")
      .split(/\s+/)
      .map((s) => s[0])
      .join("")
      .slice(0, 2)
      .toUpperCase() || "?";

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen((o) => !o)}
        aria-label="Account menu"
        className="grid h-9 w-9 place-items-center overflow-hidden rounded-full border border-border-subtle bg-subtle text-caption font-semibold text-text-primary hover:border-border-strong"
      >
        {user.image ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={user.image} alt="" className="h-full w-full object-cover" />
        ) : (
          initials
        )}
      </button>

      {open && (
        <div className="absolute right-0 top-full z-30 mt-2 w-56 animate-fadeUp rounded-md border border-border-subtle bg-surface-raised p-1 shadow-lg">
          <div className="border-b border-border-subtle px-3 py-2">
            <div className="truncate text-body-sm font-medium text-text-primary">
              {user.name ?? "Account"}
            </div>
            {user.email && (
              <div className="truncate text-caption text-text-muted">{user.email}</div>
            )}
          </div>
          <Link
            href="/dashboard"
            onClick={() => setOpen(false)}
            className="flex items-center gap-2 rounded-sm px-3 py-2 text-body-sm text-text-secondary hover:bg-subtle hover:text-text-primary"
          >
            <LayoutDashboard size={14} /> Dashboard
          </Link>
          <Link
            href="/dashboard/progress"
            onClick={() => setOpen(false)}
            className="flex items-center gap-2 rounded-sm px-3 py-2 text-body-sm text-text-secondary hover:bg-subtle hover:text-text-primary"
          >
            <UserIcon size={14} /> Progress
          </Link>
          <form action={signOutAction}>
            <button
              type="submit"
              className="flex w-full items-center gap-2 rounded-sm px-3 py-2 text-left text-body-sm text-text-secondary hover:bg-subtle hover:text-text-primary"
            >
              <LogOut size={14} /> Sign out
            </button>
          </form>
        </div>
      )}
    </div>
  );
}
