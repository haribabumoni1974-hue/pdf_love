"use client";

import { Loader2 } from "lucide-react";

/**
 * Shows processing state with honest, measurable updates. When a step count
 * is available ("Reading file 2 of 3") it is shown; no fake percentages.
 */
export function ProcessingPanel({
  message,
  current,
  total,
  onCancel,
}: {
  message: string;
  current?: number;
  total?: number;
  onCancel: () => void;
}) {
  return (
    <div role="status" aria-live="polite" className="rounded-card border border-border bg-surface p-6 shadow-card">
      <div className="flex items-center gap-4">
        <Loader2 className="h-6 w-6 shrink-0 animate-spin text-accent" aria-hidden="true" />
        <div className="min-w-0 flex-1">
          <p className="font-medium text-foreground">{message}</p>
          <p className="mt-0.5 text-sm text-muted">
            {current !== undefined && total !== undefined
              ? `File ${current} of ${total}`
              : "This may take a moment — the work is happening right here in your browser."}
          </p>
        </div>
      </div>
      <div className="mt-4 flex justify-end">
        <button
          type="button"
          onClick={onCancel}
          className="rounded-full border border-border px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-surface-2"
        >
          Cancel
        </button>
      </div>
    </div>
  );
}