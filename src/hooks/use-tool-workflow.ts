"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type {
  ProcessOptions,
  ProcessResult,
  ProgressUpdate,
  ToolConfig,
  ToolPhase,
  ValidatedFile,
  ValidationRules,
} from "@/lib/types";
import { runTool, totalPagesOf } from "@/lib/processing/run-tool";
import {
  checkFileBasics,
  findDuplicate,
  inspectInputFile,
  inspectPdfFile,
  pageLimitIssue,
} from "@/lib/validation/validate-files";
import { isAbortError, toActionableMessage } from "@/lib/processing/errors";
import type { FileValidationIssue } from "@/lib/types";

let idCounter = 0;
const nextId = () => `file-${++idCounter}`;

function invalid(entry: ValidatedFile, issue: FileValidationIssue): ValidatedFile {
  return { ...entry, status: "invalid", issue };
}

async function validateOne(entry: ValidatedFile, rules: ValidationRules, acceptEncrypted: boolean): Promise<ValidatedFile> {
  const basics = checkFileBasics(entry.file, rules);
  if (basics) return invalid(entry, basics);

  // Images (e.g. JPG tools): content-sniff only — there are no pages to count.
  if (!rules.extensions.includes("pdf")) {
    const inspection = await inspectInputFile(entry.file, rules);
    if (inspection.status === "unreadable") {
      return invalid(entry, { code: "unreadable-pdf", message: inspection.message });
    }
    return { ...entry, status: "valid" };
  }

  const inspection = await inspectPdfFile(entry.file);
  switch (inspection.status) {
    case "password-protected":
      // Tools built around passwords (e.g. unlock) accept an encrypted PDF as
      // a valid input — the password is entered on the tool page, not here.
      if (acceptEncrypted) {
        return { ...entry, status: "valid", encrypted: true };
      }
      return invalid(entry, {
        code: "password-protected",
        message: `"${entry.name}" is password-protected. Enter its password, or remove the protection with the Unlock PDF tool first.`,
      });
    case "unreadable":
      return invalid(entry, { code: "unreadable-pdf", message: inspection.message });
    case "valid":
      if (inspection.pageCount > rules.maxPagesPerFile) {
        return invalid(entry, pageLimitIssue(entry.name, rules.maxPagesPerFile));
      }
      return { ...entry, status: "valid", pageCount: inspection.pageCount };
  }
}

/**
 * Owns the complete tool workflow: file queue, validation, processing,
 * cancellation and results. Components render state; they never mutate it.
 */
export function useToolWorkflow(tool: ToolConfig) {
  const [files, setFiles] = useState<ValidatedFile[]>([]);
  const [phase, setPhase] = useState<ToolPhase>("idle");
  const [progress, setProgress] = useState<ProgressUpdate | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<ProcessResult | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const abortRef = useRef<AbortController | null>(null);
  const validatingRef = useRef(false);
  const rules = tool.validationRules;

  // Unmount safety: stop any in-flight work.
  useEffect(() => () => abortRef.current?.abort(), []);

  const addFiles = useCallback(
    async (raw: File[]) => {
      if (validatingRef.current || raw.length === 0) return;
      const existing = files.map((f) => ({ name: f.name, size: f.size }));
      const fresh: ValidatedFile[] = [];
      const skipped: string[] = [];
      const overLimit: string[] = [];
      for (const file of raw) {
        if (existing.length >= rules.maxFiles) {
          overLimit.push(file.name);
          continue;
        }
        if (findDuplicate(file, existing)) {
          skipped.push(file.name);
          continue;
        }
        fresh.push({ id: nextId(), file, name: file.name, size: file.size, status: "checking" });
        existing.push({ name: file.name, size: file.size });
      }
      const bits: string[] = [];
      if (skipped.length > 0) {
        bits.push(`${skipped.join(", ")} ${skipped.length === 1 ? "was" : "were"} skipped — already in your list.`);
      }
      if (overLimit.length > 0) {
        bits.push(`This tool accepts up to ${rules.maxFiles} file${rules.maxFiles === 1 ? "" : "s"} — ${overLimit.join(", ")} ${overLimit.length === 1 ? "was" : "were"} not added.`);
      }
      if (fresh.length === 0) {
        if (bits.length > 0) setNotice(bits.join(" "));
        return;
      }
      setFiles((prev) => [...prev, ...fresh]);
      setError(null);
      setNotice(bits.length > 0 ? bits.join(" ") : null);
      setPhase("validating");
      validatingRef.current = true;
      try {
        for (const entry of fresh) {
          const updated = await validateOne(entry, rules, tool.capabilities.acceptsEncrypted === true);
          setFiles((prev) => prev.map((f) => (f.id === entry.id ? updated : f)));
        }
      } finally {
        validatingRef.current = false;
        setPhase("ready");
      }
    },
    [files, rules, tool],
  );

  const process = useCallback(
    async (options: ProcessOptions = {}) => {
      if (phase === "processing" || validatingRef.current) return;
      setError(null);
      setResult(null);
      const valid = files.filter((f) => f.status === "valid");
      if (valid.length < rules.minFiles) {
        setError(
          `Add at least ${rules.minFiles} valid ${rules.extensions.join(", ").toUpperCase()} file${rules.minFiles === 1 ? "" : "s"} to continue.`,
        );
        return;
      }
      const totalPages = totalPagesOf(valid);
      if (totalPages > rules.maxPagesTotal) {
        setError(
          `These files total ${totalPages} pages, which exceeds the ${rules.maxPagesTotal}-page browser limit. Try fewer or smaller files.`,
        );
        return;
      }
      const controller = new AbortController();
      abortRef.current = controller;
      setPhase("processing");
      setProgress(null);
      try {
        const res = await runTool(tool, valid, options, controller.signal, (p) => setProgress(p));
      setResult(res);
      setPhase("completed");
    } catch (err) {
      if (isAbortError(err)) {
        setPhase("cancelled");
      } else {
        setError(toActionableMessage(err));
        setPhase("failed");
      }
    } finally {
      abortRef.current = null;
    }
  }, [files, phase, rules, tool]);

  const cancel = useCallback(() => abortRef.current?.abort(), []);

  const removeFile = useCallback((id: string) => {
    setFiles((prev) => {
      const next = prev.filter((f) => f.id !== id);
      if (next.length === 0) setPhase("idle");
      return next;
    });
  }, []);

  const moveFile = useCallback((id: string, delta: number) => {
    setFiles((prev) => {
      const from = prev.findIndex((f) => f.id === id);
      const to = from + delta;
      if (from < 0 || to < 0 || to >= prev.length) return prev;
      const next = [...prev];
      const [moved] = next.splice(from, 1);
      next.splice(to, 0, moved);
      return next;
    });
  }, []);

  const reorder = useCallback((from: number, to: number) => {
    setFiles((prev) => {
      if (from < 0 || from >= prev.length || to < 0 || to >= prev.length) return prev;
      const next = [...prev];
      const [moved] = next.splice(from, 1);
      next.splice(to, 0, moved);
      return next;
    });
  }, []);

  const reset = useCallback(() => {
    abortRef.current?.abort();
    setFiles([]);
    setPhase("idle");
    setProgress(null);
    setError(null);
    setResult(null);
    setNotice(null);
  }, []);

  const dismissNotice = useCallback(() => setNotice(null), []);

  const validCount = files.filter((f) => f.status === "valid").length;
  const canProcess =
    phase === "ready" && validCount >= rules.minFiles && totalPagesOf(files) <= rules.maxPagesTotal;

  const announcerMessage =
    phase === "processing" && progress
      ? progress.message
      : phase === "completed"
        ? "Your file is ready to download."
        : phase === "failed" && error
          ? error
          : phase === "cancelled"
            ? "The operation was cancelled."
            : "";

  return {
    files,
    phase,
    progress,
    error,
    result,
    notice,
    validCount,
    canProcess,
    announcerMessage,
    addFiles,
    process,
    cancel,
    removeFile,
    moveFile,
    reorder,
    reset,
    dismissNotice,
  };
}