"use client";

import { useEffect, useState, useCallback } from "react";

type Theme = "light" | "dark";

/**
 * Reads the active theme from the DOM (set by the inline script in
 * app/layout.tsx) after mount. Returns null on the very first render so
 * the caller can render an inert placeholder and avoid hydration mismatch.
 */
export function useTheme() {
  const [theme, setTheme] = useState<Theme | null>(null);

  // Sync from DOM after mount — the inline script in layout.tsx has already
  // applied either the stored preference or the OS-level setting.
  useEffect(() => {
    const current = document.documentElement.getAttribute("data-theme");
    setTheme(current === "dark" ? "dark" : "light");
  }, []);

  // Apply changes back to the DOM and persist.
  useEffect(() => {
    if (theme === null) return;
    document.documentElement.setAttribute("data-theme", theme);
    window.localStorage.setItem("theme", theme);
  }, [theme]);

  const toggle = useCallback(() => {
    setTheme((t) => (t === "dark" ? "light" : "dark"));
  }, []);

  return { theme, toggle };
}
