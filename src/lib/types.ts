import type { LucideIcon } from "lucide-react";

export type ToolCategory = "pdf" | "image";
export type ToolStatus = "ready" | "planned";
export type ToolPhase =
  | "idle"
  | "validating"
  | "ready"
  | "processing"
  | "completed"
  | "failed"
  | "cancelled";

/** Declarative capability metadata. The UI reads these — nothing is hardcoded in components. */
export interface ToolCapabilities {
  localProcessing: boolean;
  multipleFiles: boolean;
  supportsPreview: boolean;
  supportsBatch: boolean;
  supportsCancellation: boolean;
  maxRecommendedSizeMB: number;
  requiresPassword: boolean;
  /** True for tools whose whole job is password use (e.g. unlock): a password-protected PDF is a valid input there. */
  acceptsEncrypted: boolean;
  /** Where the real processing happens. Drives the privacy badge and page copy. */
  processingMode: "browser" | "server";
}

export interface ValidationRules {
  /** File extensions, e.g. ["pdf"]. */
  extensions: readonly string[];
  /** MIME types that are acceptable (empty string / octet-stream always allowed). */
  mimeTypes: readonly string[];
  minFiles: number;
  maxFiles: number;
  maxFileSizeMB: number;
  maxPagesPerFile: number;
  maxPagesTotal: number;
}

export interface ToolFaq {
  q: string;
  a: string;
}

export interface ToolConfig {
  id: string;
  slug: string;
  title: string;
  /** One-liner used on cards. */
  shortDescription: string;
  /** Longer page-level description. */
  metaDescription: string;
  longDescription: string;
  category: ToolCategory;
  icon: LucideIcon;
  keywords: string[];
  capabilities: ToolCapabilities;
  validationRules: ValidationRules;
  privacyMessage: string;
  faq: ToolFaq[];
  /** Tool ids recommended at the bottom of the tool page. */
  related: string[];
  /** "ready" = has a real working page + processor. "planned" = registered metadata only. */
  status: ToolStatus;
  loadProcessor?: () => Promise<{ default: Processor }>;
}

export interface InputFile {
  name: string;
  file: File;
  pageCount?: number;
}

export interface ProcessOptions {
  [key: string]: unknown;
}

export interface ProgressUpdate {
  stage: ToolPhase | "finalizing";
  message: string;
  current?: number;
  total?: number;
}

export type ProgressCallback = (update: ProgressUpdate) => void;

export interface ProcessInput {
  files: InputFile[];
  options: ProcessOptions;
}

export type OutputKind = "pdf" | "image" | "zip" | "docx" | "pptx" | "xlsx";

export interface OutputFile {
  name: string;
  blob: Blob;
  size: number;
  kind: OutputKind;
}

export interface ProcessResult {
  outputs: OutputFile[];
  /** Optional factual stats, e.g. compression before/after sizes. */
  summary?: { label: string; value: string }[];
  /** Optional honest result note shown with the result (e.g. "no reduction possible"). */
  note?: string;
  /** Optional honest conversion/quality warnings shown prominently (e.g. "tables not preserved"). */
  warnings?: string[];
}

/** Declarative option control for a tool's options panel (rendered by the generic runner). */
export interface OptionField {
  key: string;
  label: string;
  kind: "select" | "text";
  values?: { value: string; label: string }[];
  default?: string;
  placeholder?: string;
  hint?: string;
}

export type Processor = (
  input: ProcessInput,
  signal: AbortSignal,
  onProgress: ProgressCallback,
) => Promise<ProcessResult>;

export type FileIssueCode =
  | "unsupported-type"
  | "suspicious-type"
  | "too-large"
  | "too-many-pages"
  | "unreadable-pdf"
  | "password-protected";

export interface FileValidationIssue {
  code: FileIssueCode;
  message: string;
}

export interface ValidatedFile {
  id: string;
  file: File;
  name: string;
  size: number;
  status: "checking" | "valid" | "invalid";
  pageCount?: number;
  encrypted?: boolean;
  issue?: FileValidationIssue;
}