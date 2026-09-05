import type { OutputKind } from "@/lib/types";

/** Where the provider does its work — drives honest privacy messaging. */
export type ConversionMode = "browser" | "server";

/** Shared request contract for every conversion provider. */
export interface ConversionRequest {
  toolId: string;
  file: File;
  options: Record<string, unknown>;
  signal: AbortSignal;
  onProgress: (message: string) => void;
}

export interface ConversionOutput {
  name: string;
  blob: Blob;
  size: number;
  kind: OutputKind;
  /** Machine-readable claims produced by output validation, shown in the result. */
  validation?: Record<string, string | number | boolean>;
}

export interface ConversionResult {
  outputs: ConversionOutput[];
  summary?: { label: string; value: string }[];
  note?: string;
  warnings?: string[];
}

export interface ConversionProvider {
  readonly mode: ConversionMode;
  convert(req: ConversionRequest): Promise<ConversionResult>;
}

/** Mapping toolId → engine id used by the server endpoint (and the registry loader). */
export const TOOL_ENGINE_MAP: Record<string, string> = {
  "docx-to-pdf": "docx-to-pdf",
  "pptx-to-pdf": "pptx-to-pdf",
  "xlsx-to-pdf": "xlsx-to-pdf",
  "html-to-pdf": "html-to-pdf",
};