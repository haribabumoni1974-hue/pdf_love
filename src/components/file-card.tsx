"use client";

import { AlertTriangle, ChevronDown, ChevronUp, FileText, GripVertical, Loader2, Lock, X } from "lucide-react";
import type { ValidatedFile } from "@/lib/types";
import { formatBytes } from "@/lib/files/format";

const iconBtn =
  "flex h-8 w-8 items-center justify-center rounded-lg text-muted transition-colors hover:bg-surface-2 hover:text-foreground disabled:pointer-events-none disabled:opacity-40";

export function FileCard({
  file,
  index,
  count,
  onRemove,
  onMove,
  onDragStart,
  onDragOver,
  onDrop,
}: {
  file: ValidatedFile;
  index: number;
  count: number;
  onRemove: (id: string) => void;
  onMove: (id: string, delta: number) => void;
  onDragStart: (index: number) => void;
  onDragOver: (index: number) => void;
  onDrop: (index: number) => void;
}) {
  const statusText =
    file.status === "checking"
      ? "Checking…"
      : file.status === "invalid"
        ? file.issue?.message
        : file.encrypted
          ? "Password-protected — ready to unlock"
          : file.pageCount !== undefined
            ? `${file.pageCount} page${file.pageCount === 1 ? "" : "s"}`
            : "Ready";

  return (
    <li
      draggable={file.status === "valid"}
      onDragStart={() => onDragStart(index)}
      onDragOver={(e) => {
        e.preventDefault();
        onDragOver(index);
      }}
      onDrop={(e) => {
        e.preventDefault();
        onDrop(index);
      }}
      className={`flex items-center gap-3 rounded-card border border-border bg-surface p-3 shadow-card ${
        file.status === "invalid" ? "border-danger/30" : ""
      }`}
    >
      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-accent-soft text-accent">
        <FileText className="h-4 w-4" aria-hidden="true" />
      </span>
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium text-foreground" title={file.name}>
          {file.name}
        </p>
        <p
          className={`flex items-center gap-1.5 text-xs ${
            file.status === "invalid" ? "text-danger" : file.status === "checking" ? "text-muted" : "text-muted"
          }`}
        >
          {file.status === "checking" && <Loader2 className="h-3 w-3 animate-spin" aria-hidden="true" />}
          {file.status === "invalid" && <AlertTriangle className="h-3 w-3 shrink-0" aria-hidden="true" />}
          {file.status === "valid" && file.encrypted && <Lock className="h-3 w-3 shrink-0" aria-hidden="true" />}
          <span className="truncate">
            {file.status === "invalid" ? statusText : `${formatBytes(file.size)} · ${statusText}`}
          </span>
        </p>
      </div>
      {file.status === "valid" && count > 1 && (
        <div className="flex shrink-0 items-center gap-0.5" role="group" aria-label={`Reorder ${file.name}`}>
          <GripVertical className="h-4 w-4 text-muted/60" aria-hidden="true" />
          <button
            type="button"
            className={iconBtn}
            onClick={() => onMove(file.id, -1)}
            disabled={index === 0}
            aria-label={`Move ${file.name} up`}
            title="Move up"
          >
            <ChevronUp className="h-4 w-4" />
          </button>
          <button
            type="button"
            className={iconBtn}
            onClick={() => onMove(file.id, 1)}
            disabled={index === count - 1}
            aria-label={`Move ${file.name} down`}
            title="Move down"
          >
            <ChevronDown className="h-4 w-4" />
          </button>
        </div>
      )}
      <button
        type="button"
        className={iconBtn}
        onClick={() => onRemove(file.id)}
        aria-label={`Remove ${file.name}`}
        title="Remove file"
      >
        <X className="h-4 w-4" />
      </button>
    </li>
  );
}