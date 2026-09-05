"use client";

import { useState } from "react";
import { Eye, EyeOff, Lock, Unlock, X } from "lucide-react";
import type { ToolConfig } from "@/lib/types";
import { getToolById } from "@/config/tools";
import { useToolWorkflow } from "@/hooks/use-tool-workflow";
import { validateProtectPassword, validateUnlockPassword } from "@/lib/validation/password";
import { UploadDropzone } from "@/components/upload-dropzone";
import { FileList } from "@/components/file-list";
import { ProcessingPanel } from "@/components/processing-panel";
import { ResultCard } from "@/components/result-card";
import { ErrorMessage } from "@/components/error-message";
import { StatusAnnouncer } from "@/components/status-announcer";

const inputClass =
  "mt-1.5 h-10 w-full rounded-lg border border-border bg-surface px-3 pr-10 text-sm text-foreground placeholder:text-muted focus:border-accent focus:outline-none";

/** Toggleable password field with show/hide and an explicit error slot. */
function PasswordField({
  id,
  value,
  onChange,
  placeholder,
  hint,
  label,
  disabled,
}: {
  id: string;
  value: string;
  onChange: (v: string) => void;
  placeholder: string;
  hint?: string;
  label: string;
  disabled?: boolean;
}) {
  const [show, setShow] = useState(false);
  return (
    <div>
      <label htmlFor={id} className="block text-sm font-medium text-foreground">
        {label}
      </label>
      <div className="relative">
        <input
          id={id}
          type={show ? "text" : "password"}
          value={value}
          disabled={disabled}
          autoComplete="new-password"
          placeholder={placeholder}
          aria-describedby={hint ? `${id}-hint` : undefined}
          onChange={(e) => onChange(e.target.value)}
          className={inputClass}
        />
        <button
          type="button"
          onClick={() => setShow((s) => !s)}
          aria-label={show ? `Hide ${label.toLowerCase()}` : `Show ${label.toLowerCase()}`}
          className="absolute inset-y-0 right-0 flex w-10 items-center justify-center rounded-r-lg text-muted transition-colors hover:text-foreground"
        >
          {show ? <EyeOff className="h-4 w-4" aria-hidden="true" /> : <Eye className="h-4 w-4" aria-hidden="true" />}
        </button>
      </div>
      {hint && (
        <p id={`${id}-hint`} className="mt-1 text-xs leading-5 text-muted">
          {hint}
        </p>
      )}
    </div>
  );
}

/**
 * Shared card for the two password tools (Protect PDF, Unlock PDF). It owns
 * the password fields (show/hide, confirm, rules) and delegates file handling,
 * processing and results to the standard workflow.
 */
export function PasswordToolCard({ toolId }: { toolId: string }) {
  const tool: ToolConfig = getToolById(toolId);
  const wf = useToolWorkflow(tool);
  const isProtect = tool.id === "protect";

  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [pwError, setPwError] = useState<string | null>(null);

  const localValid = isProtect
    ? !validateProtectPassword(password, confirm)
    : !validateUnlockPassword(password);

  const run = () => {
    const err = isProtect ? validateProtectPassword(password, confirm) : validateUnlockPassword(password);
    setPwError(err);
    if (err) return;
    wf.process({ password, confirmPassword: password });
  };

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
            <FileList
              tool={tool}
              files={wf.files}
              onRemove={wf.removeFile}
              onMove={wf.moveFile}
              onReorder={wf.reorder}
              onAddFiles={wf.addFiles}
            />
          )}

          <div className="rounded-card border border-border bg-surface p-4 shadow-card">
            {isProtect ? (
              <>
                <div className="grid gap-4 sm:grid-cols-2">
                  <PasswordField
                    id="protect-password"
                    label="Password"
                    value={password}
                    onChange={(v) => {
                      setPassword(v);
                      if (pwError) setPwError(validateProtectPassword(v, confirm));
                    }}
                    placeholder="Choose a password"
                    disabled={wf.files.length === 0}
                  />
                  <PasswordField
                    id="protect-confirm"
                    label="Confirm password"
                    value={confirm}
                    onChange={(v) => {
                      setConfirm(v);
                      if (pwError) setPwError(validateProtectPassword(password, v));
                    }}
                    placeholder="Repeat the password"
                    disabled={wf.files.length === 0}
                  />
                </div>
                <ul className="mt-3 list-disc space-y-1 pl-5 text-xs leading-5 text-muted">
                  <li>4–64 characters, no leading or trailing spaces.</li>
                  <li>Both fields must match before you can protect the file.</li>
                  <li>There is no way to recover a lost password — keep it safe.</li>
                </ul>
              </>
            ) : (
              <PasswordField
                id="unlock-password"
                label="PDF password"
                value={password}
                onChange={(v) => {
                  setPassword(v);
                  if (pwError) setPwError(validateUnlockPassword(v));
                }}
                placeholder="Enter the password for this PDF"
                hint="Only unlock documents you own or have permission to modify."
                disabled={wf.files.length === 0}
              />
            )}
            {pwError && <ErrorMessage title="Check your password" detail={pwError} />}
          </div>

          {wf.error && <ErrorMessage title="We couldn't complete this" detail={wf.error} />}

          <div className="flex flex-col gap-3 pt-2 sm:flex-row sm:items-center sm:justify-between">
            <button
              type="button"
              onClick={run}
              disabled={!wf.canProcess || !localValid}
              className="inline-flex h-12 items-center justify-center gap-2 rounded-full bg-accent-strong px-6 text-sm font-semibold text-white shadow-card transition-all hover:bg-accent disabled:cursor-not-allowed disabled:opacity-50"
            >
              {isProtect ? <Lock className="h-4 w-4" aria-hidden="true" /> : <Unlock className="h-4 w-4" aria-hidden="true" />}
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