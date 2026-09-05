/**
 * Centralized, configurability-over-UI limits for the conversion engine.
 * Nothing in UI components hardcodes these — pages and validation read the
 * tool's registry entry (validationRules) and the server reads this file.
 */
export const CONVERSION_LIMITS = {
  /** Hard cap for any upload to the server conversion endpoint (MB). */
  maxUploadSizeMB: 25,
  /** Hard cap for generated output (MB). */
  maxOutputSizeMB: 50,
  /** Maximum wall-clock time for one server conversion. */
  maxConversionTimeMs: 120_000,
  /** In-process server conversion concurrency cap. */
  maxConcurrentJobs: 2,
  /** How long server temp folders may survive before the sweeper deletes them. */
  tempTtlMs: 30 * 60_000,
  /** Max raw HTML source size for the HTML → PDF tool. */
  maxHtmlBytes: 2 * 1024 * 1024,
} as const;

export const MAX_UPLOAD_BYTES = CONVERSION_LIMITS.maxUploadSizeMB * 1024 * 1024;
export const MAX_OUTPUT_BYTES = CONVERSION_LIMITS.maxOutputSizeMB * 1024 * 1024;

/** Map registry tool id → server engine id (only server-mode tools belong here). */
export const SERVER_TOOL_IDS = [
  "docx-to-pdf",
  "pptx-to-pdf",
  "xlsx-to-pdf",
  "html-to-pdf",
] as const;

export type ServerToolId = (typeof SERVER_TOOL_IDS)[number];

export function isServerToolId(id: string): id is ServerToolId {
  return (SERVER_TOOL_IDS as readonly string[]).includes(id);
}