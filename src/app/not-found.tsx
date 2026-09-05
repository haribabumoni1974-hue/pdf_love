import Link from "next/link";
import { FileQuestion } from "lucide-react";

export default function NotFound() {
  return (
    <div className="mx-auto flex max-w-2xl flex-col items-center px-4 py-24 text-center sm:px-6">
      <span className="flex h-16 w-16 items-center justify-center rounded-2xl bg-accent-soft text-accent">
        <FileQuestion className="h-8 w-8" aria-hidden="true" />
      </span>
      <h1 className="mt-6 text-3xl font-semibold tracking-tight text-foreground">Page not found</h1>
      <p className="mt-3 max-w-md text-muted">
        This page doesn&apos;t exist or hasn&apos;t been published yet. Tools are only linked from the homepage once they
        genuinely work.
      </p>
      <div className="mt-8 flex flex-col gap-3 sm:flex-row">
        <Link
          href="/"
          className="inline-flex h-12 items-center justify-center rounded-full bg-accent-strong px-6 text-sm font-semibold text-white shadow-card transition-colors hover:bg-accent"
        >
          Back to home
        </Link>
        <Link
          href="/merge-pdf"
          className="inline-flex h-12 items-center justify-center rounded-full border border-border bg-surface px-6 text-sm font-medium text-foreground transition-colors hover:bg-surface-2"
        >
          Try Merge PDF
        </Link>
      </div>
    </div>
  );
}