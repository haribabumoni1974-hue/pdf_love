"use client";

import { useState } from "react";
import { ChevronDown, ChevronUp, Play, RotateCcw, X } from "lucide-react";
import type { ToolConfig } from "@/lib/types";
import { getToolById } from "@/config/tools";
import { useToolWorkflow } from "@/hooks/use-tool-workflow";
import { UploadDropzone } from "@/components/upload-dropzone";
import { FileList } from "@/components/file-list";
import { ProcessingPanel } from "@/components/processing-panel";
import { ResultCard } from "@/components/result-card";
import { ErrorMessage } from "@/components/error-message";
import { StatusAnnouncer } from "@/components/status-announcer";

const btn =
  "flex h-7 w-7 items-center justify-center rounded-md text-muted transition-colors hover:bg-surface-2 hover:text-foreground disabled:pointer-events-none disabled:opacity-40";

export function OrganizeCard({ toolId }: { toolId: string }) {
  const tool: ToolConfig = getToolById(toolId);
  const wf = useToolWorkflow(tool);
  const first = wf.files.find((f) => f.status === "valid");
  const totalPages = first?.pageCount ?? 0;
  // Order holds 1-based source page numbers in output order. When a new
  // document is added, reset the order during render (not in an effect).
  const [order, setOrder] = useState<number[]>([]);
  const [orderFor, setOrderFor] = useState<number | null>(null);
  if (orderFor !== totalPages) {
    setOrderFor(totalPages);
    setOrder(totalPages > 0 ? Array.from({ length: totalPages }, (_, i) => i + 1) : []);
  }

  const move = (index: number, delta: number) =>
    setOrder((prev) => {
      const to = index + delta;
      if (to < 0 || to >= prev.length) return prev;
      const next = [...prev];
      const [p] = next.splice(index, 1);
      next.splice(to, 0, p);
      return next;
    });

  return (
    <div className="space-y-4">
      <StatusAnnouncer message={wf.announcerMessage} />

      {wf.phase === "processing" ? (
        <ProcessingPanel
          message={wf.progress?.message ?? "Processing…"}
          current={wf.progress?.current}
          total={wf.progress?.total}
          onCancel={wf.cancel}
        />
      ) : wf.phase === "completed" && wf.result ? (
        <ResultCard result={wf.result} onReset={wf.reset} />
      ) : (
        <>
          {wf.files.length === 0 ? (
            <UploadDropzone tool={tool} disabled={wf.phase === "validating"} onFiles={wf.addFiles} />
          ) : (
            <>
              <FileList
                tool={tool}
                files={wf.files}
                onRemove={wf.removeFile}
                onMove={wf.moveFile}
                onReorder={wf.reorder}
                onAddFiles={wf.addFiles}
              />
              {order.length > 0 ? (
                <div className="rounded-card border border-border bg-surface p-4 shadow-card">
                  <div className="flex items-center justify-between gap-3">
                    <h2 className="text-sm font-semibold text-foreground">
                      Page order <span className="font-normal text-muted">({order.length} of {totalPages})</span>
                    </h2>
                    <button
                      type="button"
                      onClick={() => setOrder(Array.from({ length: totalPages }, (_, i) => i + 1))}
                      className="inline-flex items-center gap-1.5 rounded-full border border-border px-3 py-1.5 text-xs font-medium text-muted transition-colors hover:bg-surface-2 hover:text-foreground"
                    >
                      <RotateCcw className="h-3 w-3" aria-hidden="true" />
                      Reset order
                    </button>
                  </div>
                  <ul className="mt-3 space-y-1.5" aria-label="New page order">
                    {order.map((page, index) => (
                      <li
                        key={`${page}-${index}`}
                        className="flex items-center gap-2 rounded-lg border border-border bg-background px-3 py-2"
                      >
                        <span className="w-8 shrink-0 text-center text-xs font-semibold text-accent">{index + 1}</span>
                        <span className="flex-1 truncate text-sm text-foreground">Original page {page}</span>
                        <div className="flex shrink-0 items-center gap-0.5">
                          <button type="button" className={btn} disabled={index === 0} onClick={() => move(index, -1)} aria-label={`Move original page ${page} up`}>
                            <ChevronUp className="h-4 w-4" />
                          </button>
                          <button type="button" className={btn} disabled={index === order.length - 1} onClick={() => move(index, 1)} aria-label={`Move original page ${page} down`}>
                            <ChevronDown className="h-4 w-4" />
                          </button>
                          <button type="button" className={`${btn} hover:!text-danger`} onClick={() => setOrder((prev) => prev.filter((_, i) => i !== index))} aria-label={`Remove original page ${page}`}>
                            <X className="h-4 w-4" />
                          </button>
                        </div>
                      </li>
                    ))}
                  </ul>
                  {order.length < totalPages && (
                    <p className="mt-2 text-xs text-muted">
                      {totalPages - order.length} page{totalPages - order.length === 1 ? "" : "s"} will be removed from the
                      output.
                    </p>
                  )}
                </div>
              ) : (
                <p className="text-sm text-muted">Select the document to reorder its pages.</p>
              )}
            </>
          )}

          {wf.error && <ErrorMessage title="We couldn't complete this" detail={wf.error} />}

          <div className="flex flex-col gap-3 pt-2 sm:flex-row sm:items-center">
            <button
              type="button"
              onClick={() => wf.process({ order: order.join(",") })}
              disabled={!wf.canProcess || order.length === 0}
              className="inline-flex h-12 items-center justify-center gap-2 rounded-full bg-accent-strong px-6 text-sm font-semibold text-white shadow-card transition-all hover:bg-accent disabled:cursor-not-allowed disabled:opacity-50"
            >
              <Play className="h-4 w-4" aria-hidden="true" />
              Apply order
            </button>
            <button
              type="button"
              onClick={wf.reset}
              className="inline-flex h-12 items-center justify-center rounded-full border border-border px-5 text-sm font-medium text-muted transition-colors hover:bg-surface-2 hover:text-foreground"
            >
              Clear all
            </button>
          </div>
        </>
      )}
    </div>
  );
}