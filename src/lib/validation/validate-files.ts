import type { FileValidationIssue, ValidationRules } from "@/lib/types";
import { formatBytes } from "@/lib/files/format";
import { fileExtension } from "@/lib/files/names";
import { inspectPdf } from "@/lib/pdf/parse-pdf";

export type PdfInspection =
  | { status: "valid"; pageCount: number }
  | { status: "password-protected" }
  | { status: "unreadable"; message: string };

export type ImageInspection = { status: "valid" } | { status: "unreadable"; message: string };

/** Content sniff: JPEG files begin with the FF D8 FF magic bytes. */
export async function looksLikeJpeg(file: File): Promise<boolean> {
  try {
    const head = new Uint8Array(await file.slice(0, 3).arrayBuffer());
    return head.length === 3 && head[0] === 0xff && head[1] === 0xd8 && head[2] === 0xff;
  } catch {
    return false;
  }
}

/** Inspect an actual JPEG file — never trust the filename or MIME alone. */
export async function inspectImageFile(file: File): Promise<ImageInspection> {
  if (!(await looksLikeJpeg(file))) {
    return {
      status: "unreadable",
      message: `"${file.name}" doesn't look like a real JPEG. Renaming a file doesn't change its content.`,
    };
  }
  return { status: "valid" };
}

/** Pick the right content inspection for a tool's accepted types (PDFs are parsed, images are sniffed). */
export async function inspectInputFile(file: File, rules: ValidationRules): Promise<PdfInspection | ImageInspection> {
  return rules.extensions.includes("pdf") ? inspectPdfFile(file) : inspectImageFile(file);
}

/** Content sniff: real PDFs begin with the %PDF- magic bytes. */
export async function looksLikePdf(file: File): Promise<boolean> {
  try {
    const head = new Uint8Array(await file.slice(0, 5).arrayBuffer());
    return head.length >= 5 && String.fromCharCode(...head) === "%PDF-";
  } catch {
    return false;
  }
}

/** Inspect an actual PDF file (extension + magic bytes + parse) — never trust the filename or MIME alone. */
export async function inspectPdfFile(file: File): Promise<PdfInspection> {
  const extOk = fileExtension(file.name) === "pdf";
  if (extOk && !(await looksLikePdf(file))) {
    return {
      status: "unreadable",
      message: `"${file.name}" doesn't look like a real PDF file. Renaming a file doesn't change its content.`,
    };
  }
  try {
    const info = await inspectPdf(file);
    if (info.encrypted) return { status: "password-protected" };
    return { status: "valid", pageCount: info.pageCount };
  } catch (err) {
    return {
      status: "unreadable",
      message: err instanceof Error ? err.message : "This PDF could not be read. It may be corrupted or unsupported.",
    };
  }
}

/** Synchronous checks: extension, size, and a MIME sanity check (empty/octet-stream always passes). */
export function checkFileBasics(file: File, rules: ValidationRules): FileValidationIssue | null {
  const ext = fileExtension(file.name);
  if (!rules.extensions.includes(ext)) {
    return {
      code: "unsupported-type",
      message: `"${file.name}" is not a supported file type. This tool accepts ${rules.extensions.join(", ")} files.`,
    };
  }
  if (file.type && rules.mimeTypes.length > 0 && !rules.mimeTypes.includes(file.type) && file.type !== "application/octet-stream") {
    return {
      code: "suspicious-type",
      message: `"${file.name}" reports itself as ${file.type || "an unknown type"} but has a .${ext} extension. The file type may not match its name.`,
    };
  }
  const maxBytes = rules.maxFileSizeMB * 1024 * 1024;
  if (file.size > maxBytes) {
    return {
      code: "too-large",
      message: `"${file.name}" is ${formatBytes(file.size)}, which exceeds the ${rules.maxFileSizeMB} MB recommended limit for browser processing. Try a smaller file or fewer pages.`,
    };
  }
  return null;
}

/** De-duplicate against an existing list by name + size. */
export function findDuplicate(file: File, existing: { name: string; size: number }[]): boolean {
  return existing.some((f) => f.name === file.name && f.size === file.size);
}

export function pageLimitIssue(name: string, limit: number): FileValidationIssue {
  return {
    code: "too-many-pages",
    message: `"${name}" has more than ${limit} pages. This tool's browser limit is ${limit} pages per file.`,
  };
}