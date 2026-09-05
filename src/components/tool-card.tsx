import Link from "next/link";
import { ArrowRight } from "lucide-react";
import type { ToolConfig } from "@/lib/types";

/**
 * Tool card. `ready` tools are links to their working page; `planned` tools
 * render as honest, non-interactive cards (no fake buttons, no 404s).
 */
export function ToolCard({ tool }: { tool: ToolConfig }) {
  const Icon = tool.icon;
  const ready = tool.status === "ready";

  const inner = (
    <>
      <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-accent-soft text-accent">
        <Icon className="h-5 w-5" aria-hidden="true" />
      </span>
      <div className="mt-4">
        <h3 className="font-semibold text-foreground">{tool.title}</h3>
        <p className="mt-1 text-sm leading-6 text-muted">{tool.shortDescription}</p>
      </div>
      {ready && (
        <span className="mt-4 inline-flex items-center gap-1 text-sm font-medium text-accent">
          Open tool
          <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" aria-hidden="true" />
        </span>
      )}
    </>
  );

  const classes = `group flex h-full flex-col rounded-card border border-border bg-surface p-5 shadow-card transition-all ${
    ready
      ? "hover:-translate-y-0.5 hover:border-accent/40 hover:shadow-pop"
      : "opacity-70"
  }`;

  if (ready) {
    return (
      <Link href={`/${tool.slug}`} className={classes}>
        {inner}
      </Link>
    );
  }
  return (
    <div className={classes} aria-disabled="true" aria-label={`${tool.title} — coming soon`}>
      {inner}
    </div>
  );
}