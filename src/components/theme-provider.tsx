"use client";

import { createContext, useCallback, useContext, useEffect, useLayoutEffect, useState } from "react";
import type { ReactNode } from "react";

export type Theme = "light" | "dark" | "system";
const STORAGE_KEY = "pdf_love:theme";

// Layout effects run before the browser paints, but are a no-op during SSR.
// This keeps the same effect API on the server while applying the theme
// pre-paint on the client (see apply below).
const useIsomorphicLayoutEffect = typeof window !== "undefined" ? useLayoutEffect : useEffect;

interface ThemeContextValue {
  theme: Theme;
  setTheme: (theme: Theme) => void;
}

const ThemeContext = createContext<ThemeContextValue>({ theme: "system", setTheme: () => {} });

function resolveDark(theme: Theme): boolean {
  if (theme === "dark") return true;
  if (theme === "light") return false;
  return window.matchMedia("(prefers-color-scheme: dark)").matches;
}

function readStoredTheme(): Theme {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored === "light" || stored === "dark" || stored === "system" ? stored : "system";
  } catch {
    return "system";
  }
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  // Read storage on first client render. The inline head script already set
  // the class pre-render, so there is no flash of the wrong theme.
  const [theme, setThemeState] = useState<Theme>(() => {
    if (typeof window === "undefined") return "system";
    return readStoredTheme();
  });

  // Pre-paint (layout) effect, so the correct class is in place before the
  // browser paints on mount, after a client-side navigation, and after the
  // development StrictMode remount (which resets <html> to only the
  // attributes React manages, clearing the class the parse-time script set).
  useIsomorphicLayoutEffect(() => {
    document.documentElement.classList.toggle("dark", resolveDark(theme));
    try {
      localStorage.setItem(STORAGE_KEY, theme);
    } catch {
      /* storage unavailable — theme still applies for this session */
    }
  }, [theme]);

  // Follow OS changes while in "system" mode.
  useEffect(() => {
    if (theme !== "system" || typeof window === "undefined") return;
    const mq = window.matchMedia("(prefers-color-scheme: dark)");
    const onChange = () => document.documentElement.classList.toggle("dark", mq.matches);
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, [theme]);

  const setTheme = useCallback((next: Theme) => setThemeState(next), []);

  return (
    <ThemeContext.Provider value={{ theme, setTheme }}>{children}</ThemeContext.Provider>
  );
}

export function useTheme(): ThemeContextValue {
  return useContext(ThemeContext);
}