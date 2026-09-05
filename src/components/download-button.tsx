"use client";

import { useEffect, useRef } from "react";
import { Download } from "lucide-react";
import type { OutputFile } from "@/lib/types";

/**
 * Downloads the actual generated Blob. The object URL is created lazily on the
 * first click (so it is always live) and revoked when the button unmounts.
 */
export function DownloadButton({
  output,
  label = "Download",
}: {
  output: OutputFile;
  label?: string;
}) {
  const urlRef = useRef<string | null>(null);

  useEffect(() => {
    return () => {
      if (urlRef.current) {
        URL.revokeObjectURL(urlRef.current);
        urlRef.current = null;
      }
    };
  }, []);

  const handleClick = () => {
    if (!urlRef.current) {
      urlRef.current = URL.createObjectURL(output.blob);
    }
    const link = document.createElement("a");
    link.href = urlRef.current;
    link.download = output.name;
    document.body.appendChild(link);
    link.click();
    link.remove();
  };

  return (
    <button
      type="button"
      onClick={handleClick}
      className="inline-flex items-center gap-2 rounded-full bg-accent-strong px-5 py-2.5 text-sm font-semibold text-white shadow-card transition-colors hover:bg-accent"
    >
      <Download className="h-4 w-4" aria-hidden="true" />
      {label}
    </button>
  );
}