"use client";

import { Layers, X } from "lucide-react";
import { getToolById } from "@/config/tools";
import { useToolWorkflow } from "@/hooks/use-tool-workflow";
import { UploadDropzone } from "@/components/upload-dropzone";
import { FileList } from "@/components/file-list";
import { ProcessingPanel } from "@/components/processing-panel";
import { ResultCard } from "@/components/result-card";
import { ErrorMessage } from "@/components/error-message";
import { StatusAnnouncer } from "@/components/status-announcer";

export function MergeToolCard() {
  const tool = getToolById("merge");
  const wf = useToolWorkflow(tool);

  return (
    <div className="space-y-4">
      <StatusAnnouncer message={wf.announcerMessage} />

      {wf.notice && (
        <div role="status" className="flex items-start gap-2 rounded-card border border-border bg-surface p-3 text-sm text-muted">
          <span className="flex-1">{wf.notice}</span>
          <button type="button" onClick={wf.dismissNotice} aria-label="Dismiss notice" className="rounded p-1 hover:bg-surface-2">
            <X className="h-4 w-4" aria-hidden="true" />
          </button>
        </div>
      )}

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
          <UploadDropzone tool={tool} disabled={wf.phase === "validating"} onFiles={wf.addFiles} />

          {wf.files.length > 0 && (
            <>
              <p className="text-sm font-medium text-foreground">
                Files to merge <span className="text-muted">({wf.files.length})</span>
              </p>
              <p className="text-xs text-muted">
                The merged PDF follows the order below. Drag a file, or use the arrows.
              </p>
              <FileList
                tool={tool}
                files={wf.files}
                onRemove={wf.removeFile}
                onMove={wf.moveFile}
                onReorder={wf.reorder}
                onAddFiles={wf.addFiles}
              />
            </>
          )}

          {wf.error && (
            <ErrorMessage
              title={wf.phase === "cancelled" ? "Operation cancelled" : "We couldn't complete this"}
              detail={wf.error}
            />
          )}

          <div className="flex flex-col gap-3 pt-2 sm:flex-row sm:items-center sm:justify-between">
            <button
              type="button"
              onClick={() => wf.process({})}
              disabled={!wf.canProcess || wf.phase === "validating"}
              className="inline-flex h-12 items-center justify-center gap-2 rounded-full bg-accent-strong px-6 text-sm font-semibold text-white shadow-card transition-all hover:bg-accent disabled:cursor-not-allowed disabled:opacity-50 sm:min-w-44"
            >
              <Layers className="h-4 w-4" aria-hidden="true" />
              {wf.validCount >= 2 ? `Merge ${wf.validCount} files` : "Merge PDF"}
            </button>
            {wf.files.length > 0 && (
              <button
                type="button"
                onClick={wf.reset}
                className="inline-flex h-12 items-center justify-center rounded-full border border-border px-5 text-sm font-medium text-muted transition-colors hover:bg-surface-2 hover:text-foreground"
              >
                Clear all
              </button>
            )}
          </div>
        </>
      )}
    </div>
  );
}