"use client";

import { useEffect, useState } from "react";
import { Archive, Check, FileText, Loader2, RefreshCw } from "lucide-react";
import type { OutputFile, ProcessResult } from "@/lib/types";
import { formatBytes } from "@/lib/files/format";
import { createZipBlob } from "@/lib/files/zip";
import { DownloadButton } from "@/components/download-button";

/** Inline preview of a generated image output. URL is created lazily on mount and revoked on unmount. */
function OutputThumb({ blob, alt }: { blob: Blob; alt: string }) {
  const [url] = useState(() => URL.createObjectURL(blob));
  useEffect(() => {
    return () => URL.revokeObjectURL(url);
  }, [url]);
  return (
    <img
      src={url}
      alt={`Preview of ${alt}`}
      className="h-16 w-auto max-w-28 rounded-md border border-border bg-white object-contain shadow-card"
    />
  );
}

/** Bundle every output into a real ZIP archive on demand and download it. */
function DownloadAllZip({ outputs, zipName }: { outputs: OutputFile[]; zipName: string }) {
  const [zip, setZip] = useState<Blob | null>(null);
  const [busy, setBusy] = useState(false);

  const download = (blob: Blob) => {
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = zipName;
    document.body.appendChild(link);
    link.click();
    link.remove();
    setTimeout(() => URL.revokeObjectURL(url), 10_000);
  };

  const handleClick = async () => {
    if (zip) {
      download(zip);
      return;
    }
    setBusy(true);
    try {
      const blob = await createZipBlob(outputs.map((o) => ({ name: o.name, blob: o.blob })));
      setZip(blob);
      download(blob);
    } finally {
      setBusy(false);
    }
  };

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={busy}
      className="inline-flex items-center gap-2 rounded-full border border-border px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-surface disabled:opacity-60"
    >
      {busy ? <Loader2 className="h-4 w-4 animate-spin text-accent" aria-hidden="true" /> : <Archive className="h-4 w-4 text-accent" aria-hidden="true" />}
      Download all as ZIP
    </button>
  );
}

export function ResultCard({ result, onReset, zipName }: { result: ProcessResult; onReset: () => void; zipName?: string }) {
  return (
    <div className="rounded-card border border-success/25 bg-success-soft p-6 shadow-card">
      <div className="flex items-start gap-3">
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-success text-white">
          <Check className="h-5 w-5" aria-hidden="true" />
        </span>
        <div className="min-w-0 flex-1">
          <h3 className="font-semibold text-foreground">Done — your file is ready</h3>
          <p className="mt-1 text-sm text-muted">The output was generated and verified in your browser.</p>
        </div>
      </div>

      {result.summary && result.summary.length > 0 && (
        <dl className="mt-4 flex flex-wrap gap-3">
          {result.summary.map((item) => (
            <div key={item.label} className="rounded-lg border border-border bg-surface px-3 py-2 text-sm">
              <dt className="text-xs text-muted">{item.label}</dt>
              <dd className="font-semibold text-foreground">{item.value}</dd>
            </div>
          ))}
        </dl>
      )}

      {result.note && (
        <p className="mt-4 rounded-lg border border-border bg-surface p-3 text-sm leading-6 text-muted">{result.note}</p>
      )}

      <ul className="mt-4 space-y-2">
        {result.outputs.map((output) => (
          <li
            key={output.name}
            className="flex flex-col gap-3 rounded-card border border-border bg-surface p-4 sm:flex-row sm:items-center"
          >
            {output.kind === "image" && <OutputThumb blob={output.blob} alt={output.name} />}
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-accent-soft text-accent">
              <FileText className="h-4 w-4" aria-hidden="true" />
            </span>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium text-foreground" title={output.name}>
                {output.name}
              </p>
              <p className="text-xs text-muted">{formatBytes(output.size)}</p>
            </div>
            <DownloadButton output={output} label="Download" />
          </li>
        ))}
      </ul>

      {zipName && result.outputs.length > 1 && (
        <div className="mt-4 flex justify-end">
          <DownloadAllZip outputs={result.outputs} zipName={zipName} />
        </div>
      )}

      <div className="mt-4 flex justify-end">
        <button
          type="button"
          onClick={onReset}
          className="inline-flex items-center gap-2 rounded-full border border-border px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-surface"
        >
          <RefreshCw className="h-4 w-4" aria-hidden="true" />
          Process another file
        </button>
      </div>
    </div>
  );
}