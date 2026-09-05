import mammoth from "mammoth";
import { ToolError } from "@/lib/processing/errors";

/** Wrap extracted HTML into a printable document shell (server-side). */
export function wrapInHtmlDocument(bodyHtml: string, title = "Document"): string {
  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8"/>
<title>${escapeHtml(title)}</title>
<style>
  body { font-family: Calibri, 'Segoe UI', Arial, sans-serif; margin: 40px; color: #1a1a1a; }
  table { border-collapse: collapse; width: 100%; }
  td, th { border: 1px solid #999; padding: 4px 8px; font-size: 11pt; }
  th { background: #f0f0f0; }
  h1 { font-size: 20pt; } h2 { font-size: 16pt; } h3 { font-size: 14pt; }
  p { margin: 0 0 8px 0; }
  @media print { body { margin: 20px; } }
</style>
</head>
<body>${bodyHtml}</body>
</html>`;
}

function escapeHtml(s: string): string {
  return s.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]!);
}

/**
 * Convert a DOCX to HTML using mammoth (real Word→HTML extraction):
 * paragraphs, headings, tables, lists and embedded images are preserved.
 * Unsupported constructs (e.g. some fields, tracked changes) are reported.
 */
export async function docxToHtml(buffer: ArrayBuffer): Promise<{ html: string; warnings: string[] }> {
  const warnings: string[] = [];
  let result;
  try {
    result = await mammoth.convertToHtml({ buffer: Buffer.from(buffer) });
  } catch (err) {
    throw new ToolError(
      `This DOCX could not be read for conversion. It may be corrupted or use unsupported Word features.${err instanceof Error ? ` (${err.message})` : ""}`,
    );
  }
  let html = result.value ?? "";
  if (html.trim().length === 0) {
    throw new ToolError("No document content could be extracted from this DOCX.");
  }
  if (result.messages.length > 0) {
    warnings.push("Some parts of the Word document could not be reproduced (unsupported features, broken references, or embedded objects).");
  }
  // Outline the result:
  const hasPageBreak = /page-break|lastRenderedPageBreak|w:br w:type="page"/.test(html);
  if (hasPageBreak) warnings.push("Explicit page breaks are honoured during PDF generation.");
  return { html: wrapInHtmlDocument(html), warnings };
}