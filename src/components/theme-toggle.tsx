"use client";

import { Monitor, Moon, Sun } from "lucide-react";
import { useTheme } from "@/components/theme-provider";
import type { Theme } from "@/components/theme-provider";

const OPTIONS: { value: Theme; label: string; icon: typeof Sun }[] = [
  { value: "light", label: "Light theme", icon: Sun },
  { value: "dark", label: "Dark theme", icon: Moon },
  { value: "system", label: "Use system theme", icon: Monitor },
];

export function ThemeToggle() {
  const { theme, setTheme } = useTheme();
  return (
    <div
      role="group"
      aria-label="Color theme"
      suppressHydrationWarning
      className="flex items-center gap-0.5 rounded-full border border-border bg-surface p-0.5"
    >
      {OPTIONS.map(({ value, label, icon: Icon }) => {
        const active = theme === value;
        return (
          <button
            key={value}
            type="button"
            onClick={() => setTheme(value)}
            aria-pressed={active}
            aria-label={label}
            title={label}
            suppressHydrationWarning
            className={`flex h-7 w-7 items-center justify-center rounded-full transition-colors ${
              active ? "bg-accent-soft text-accent" : "text-muted hover:text-foreground"
            }`}
          >
            <Icon className="h-3.5 w-3.5" aria-hidden="true" />
          </button>
        );
      })}
    </div>
  );
}