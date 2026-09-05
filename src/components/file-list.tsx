"use client";

import { useRef, useState } from "react";
import { Plus } from "lucide-react";
import type { ToolConfig, ValidatedFile } from "@/lib/types";
import { FileCard } from "@/components/file-card";

export function FileList({
  tool,
  files,
  onRemove,
  onMove,
  onReorder,
  onAddFiles,
}: {
  tool: ToolConfig;
  files: ValidatedFile[];
  onRemove: (id: string) => void;
  onMove: (id: string, delta: number) => void;
  onReorder: (from: number, to: number) => void;
  onAddFiles: (files: File[]) => void;
}) {
  const [dragIndex, setDragIndex] = useState<number | null>(null);
  const [overIndex, setOverIndex] = useState<number | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const accept = tool.validationRules.extensions.map((e) => `.${e}`).join(",");

  const handleDrop = (target: number) => {
    if (dragIndex !== null && dragIndex !== target) onReorder(dragIndex, target);
    setDragIndex(null);
    setOverIndex(null);
  };

  return (
    <div>
      <ul className="space-y-2" aria-label="Your files, in merge order">
        {files.map((file, i) => (
          <FileCard
            key={file.id}
            file={file}
            index={i}
            count={files.length}
            onRemove={onRemove}
            onMove={onMove}
            onDragStart={(from) => setDragIndex(from)}
            onDragOver={(over) => {
              setOverIndex(over);
            }}
            onDrop={handleDrop}
          />
        ))}
      </ul>
      {overIndex !== null && dragIndex !== null && overIndex !== dragIndex && (
        <p className="sr-only" aria-live="polite">
          Moving file from position {dragIndex + 1} to {overIndex + 1}
        </p>
      )}
      {tool.capabilities.multipleFiles && (
        <div className="mt-3">
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            className="inline-flex items-center gap-2 rounded-full border border-border bg-surface px-4 py-2 text-sm font-medium text-foreground transition-colors hover:border-accent/40 hover:bg-accent-soft"
          >
            <Plus className="h-4 w-4 text-accent" aria-hidden="true" />
            Add more files
          </button>
          <input
            ref={inputRef}
            type="file"
            accept={accept}
            multiple
            className="sr-only"
            onChange={(e) => {
              if (e.target.files) onAddFiles(Array.from(e.target.files));
              e.target.value = "";
            }}
          />
        </div>
      )}
    </div>
  );
}