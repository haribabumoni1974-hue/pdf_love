"use client";

import { useRef, useState } from "react";
import { Upload } from "lucide-react";
import type { ToolConfig } from "@/lib/types";
/**
 * Universal upload engine: drag & drop, click-to-upload, keyboard activation,
 * multi-file support. File validation happens in the parent's validation engine.
 */
export function UploadDropzone({
  tool,
  disabled,
  onFiles,
}: {
  tool: ToolConfig;
  disabled?: boolean;
  onFiles: (files: File[]) => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);
  const { validationRules: rules, capabilities } = tool;

  const accept = rules.extensions.map((e) => `.${e}`).join(",");

  const handleFiles = (list: FileList | null) => {
    if (!list || list.length === 0) return;
    onFiles(Array.from(list));
  };

  return (
    <div>
      <label
        className={`group relative flex min-h-56 cursor-pointer flex-col items-center justify-center rounded-card border-2 border-dashed px-6 py-10 text-center transition-colors ${
          dragging
            ? "border-accent bg-accent-soft"
            : "border-border bg-surface hover:border-accent/50 hover:bg-surface-2"
        } ${disabled ? "pointer-events-none opacity-60" : ""} focus-within:border-accent`}
        onDragOver={(e) => {
          e.preventDefault();
          if (!disabled) setDragging(true);
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDragging(false);
          if (!disabled) handleFiles(e.dataTransfer.files);
        }}
      >
        <input
          ref={inputRef}
          type="file"
          accept={accept}
          multiple={capabilities.multipleFiles}
          className="sr-only"
          onChange={(e) => {
            handleFiles(e.target.files);
            e.target.value = "";
          }}
        />
        <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-accent-soft text-accent transition-transform group-hover:scale-105">
          <Upload className="h-6 w-6" aria-hidden="true" />
        </span>
        <span className="mt-4 text-lg font-semibold text-foreground">
          Drop your {rules.extensions.join(", ").toUpperCase()} here
        </span>
        <span className="mt-1 text-sm text-muted">or</span>
        <span className="mt-2 inline-flex items-center rounded-full bg-accent px-4 py-2 text-sm font-medium text-white">
          Choose file{capabilities.multipleFiles ? "s" : ""}
        </span>
        <span className="mt-4 text-xs text-muted">
          {rules.extensions.join(", ").toUpperCase()} · up to {rules.maxFileSizeMB} MB per file ·{" "}
          {rules.minFiles === rules.maxFiles
            ? `${rules.minFiles} file`
            : `${rules.minFiles}–${rules.maxFiles} files`}
        </span>
      </label>
      {capabilities.multipleFiles && (
        <p className="mt-2 text-center text-xs text-muted">Tip: you can drag in several files at once.</p>
      )}
    </div>
  );
}