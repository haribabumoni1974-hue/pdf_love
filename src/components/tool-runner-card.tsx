"use client";

import { useState } from "react";
import { Play, X } from "lucide-react";
import type { OptionField, ProcessOptions, ToolConfig } from "@/lib/types";
import { getToolById } from "@/config/tools";
import { useToolWorkflow } from "@/hooks/use-tool-workflow";
import { UploadDropzone } from "@/components/upload-dropzone";
import { FileList } from "@/components/file-list";
import { ProcessingPanel } from "@/components/processing-panel";
import { ResultCard } from "@/components/result-card";
import { ErrorMessage } from "@/components/error-message";
import { StatusAnnouncer } from "@/components/status-announcer";

function FieldControl({
  field,
  value,
  onChange,
  disabled,
}: {
  field: OptionField;
  value: string;
  onChange: (value: string) => void;
  disabled: boolean;
}) {
  const id = `opt-${field.key}`;
  return (
    <div>
      <label htmlFor={id} className="block text-sm font-medium text-foreground">
        {field.label}
      </label>
      {field.kind === "select" ? (
        <select
          id={id}
          value={value}
          disabled={disabled}
          onChange={(e) => onChange(e.target.value)}
          className="mt-1.5 h-10 w-full rounded-lg border border-border bg-surface px-3 text-sm text-foreground disabled:opacity-60"
        >
          {(field.values ?? []).map((v) => (
            <option key={v.value} value={v.value}>
              {v.label}
            </option>
          ))}
        </select>
      ) : (
        <input
          id={id}
          type="text"
          value={value}
          disabled={disabled}
          placeholder={field.placeholder}
          aria-describedby={field.hint ? `${id}-hint` : undefined}
          onChange={(e) => onChange(e.target.value)}
          className="mt-1.5 h-10 w-full rounded-lg border border-border bg-surface px-3 text-sm text-foreground placeholder:text-muted disabled:opacity-60"
        />
      )}
      {field.hint && (
        <p id={`${id}-hint`} className="mt-1 text-xs leading-5 text-muted">
          {field.hint}
        </p>
      )}
    </div>
  );
}

/**
 * The universal runner. Capabilities + validation rules live in the tool's
 * registry entry; option fields are declared per tool and passed in. This
 * card is shared by every single-document tool (and multi-image tools).
 */
export function ToolRunnerCard({ toolId, fields = [] }: { toolId: string; fields?: OptionField[] }) {
  const tool: ToolConfig = getToolById(toolId);
  const wf = useToolWorkflow(tool);
  const [options, setOptions] = useState<ProcessOptions>(() =>
    Object.fromEntries(fields.map((f) => [f.key, f.default ?? (f.values ? f.values[0].value : "")])),
  );

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
        <ResultCard result={wf.result} onReset={wf.reset} zipName={`${tool.slug}-outputs.zip`} />
      ) : (
        <>
          <UploadDropzone tool={tool} disabled={wf.phase === "validating"} onFiles={wf.addFiles} />

          {wf.files.length > 0 && (
            <>
              <p className="text-sm font-medium text-foreground">
                {tool.capabilities.multipleFiles ? "Your files" : "Your file"}{" "}
                <span className="text-muted">({wf.files.length})</span>
              </p>
              {tool.capabilities.multipleFiles && (
                <p className="text-xs text-muted">The output follows the order below — drag a file or use the arrows.</p>
              )}
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

          {fields.length > 0 && (
            <div className="rounded-card border border-border bg-surface p-4 shadow-card">
              <div className="grid gap-4 sm:grid-cols-2">
                {fields.map((field) => (
                  <FieldControl
                    key={field.key}
                    field={field}
                    value={String(options[field.key] ?? "")}
                    disabled={wf.phase === "validating" || wf.files.length === 0}
                    onChange={(v) => setOptions((prev) => ({ ...prev, [field.key]: v }))}
                  />
                ))}
              </div>
            </div>
          )}

          {wf.error && <ErrorMessage title="We couldn't complete this" detail={wf.error} />}

          <div className="flex flex-col gap-3 pt-2 sm:flex-row sm:items-center sm:justify-between">
            <button
              type="button"
              onClick={() => wf.process(options)}
              disabled={!wf.canProcess}
              className="inline-flex h-12 items-center justify-center gap-2 rounded-full bg-accent-strong px-6 text-sm font-semibold text-white shadow-card transition-all hover:bg-accent disabled:cursor-not-allowed disabled:opacity-50"
            >
              <Play className="h-4 w-4" aria-hidden="true" />
              {tool.title}
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