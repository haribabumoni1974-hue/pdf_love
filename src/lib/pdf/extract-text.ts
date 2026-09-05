import { getDocument } from "pdfjs-dist";
import "pdfjs-dist/build/pdf.mjs";
import { ensurePdfWorker } from "@/lib/pdf/parse-pdf";
import { ToolError } from "@/lib/processing/errors";

export interface ExtractedLine {
  /** Concatenated text for the line. */
  text: string;
  /** Average font size across the line (best-effort, for heading detection). */
  fontSize: number;
  /** Approximate vertical position (top of line, PDF points). */
  y: number;
  /** Approximate horizontal position (left of line, PDF points). */
  x: number;
}

export interface ExtractedPage {
  lines: ExtractedLine[];
  width: number;
  height: number;
}

/**
 * Extract text from a PDF via pdf.js, grouping characters into lines by their
 * vertical position. This is a real text extraction (not OCR) — image-only
 * pages yield no lines, which callers must report honestly.
 *
 * Browser-only (needs the pdf.js worker). The legacy build is used in tests.
 */
export async function extractPdfText(blob: Blob): Promise<ExtractedPage[]> {
  ensurePdfWorker();
  const data = new Uint8Array(await blob.arrayBuffer());
  const task = getDocument({ data, useWorkerFetch: false, disableAutoFetch: true });
  try {
    const doc = await task.promise;
    const pages: ExtractedPage[] = [];
    for (let i = 1; i <= doc.numPages; i++) {
      const page = await doc.getPage(i);
      const content = await page.getTextContent();
      const viewport = page.getViewport({ scale: 1 });
      const width = viewport.width;
      const height = viewport.height;
      // Group items into lines by rounding their vertical position.
      const grouped = new Map<number, { text: string[]; sizes: number[]; x: number }>();
      for (const item of content.items) {
        if (!("str" in item)) continue;
        const str = (item as { str: string }).str;
        if (!str || !str.trim()) continue;
        const transform = (item as { transform?: number[] }).transform;
        const size = transform ? Math.hypot(transform[2], transform[3]) : 12;
        const y = transform ? transform[5] : 0;
        const x = transform ? transform[4] : 0;
        const key = Math.round(y / 3);
        const bucket = grouped.get(key) ?? { text: [], sizes: [], x };
        bucket.text.push(str);
        bucket.sizes.push(size);
        grouped.set(key, bucket);
      }
      const lines = [...grouped.entries()]
        .map(([y, b]) => ({
          text: b.text.join("").replace(/\s+/g, " ").trim(),
          fontSize: b.sizes.reduce((a, s) => a + s, 0) / Math.max(1, b.sizes.length),
          y: y * 3,
          x: b.x,
        }))
        .filter((l) => l.text.length > 0)
        .sort((a, b) => (a.y === b.y ? a.x - b.x : b.y - a.y));
      pages.push({ lines, width, height });
    }
    await task.destroy();
    return pages;
  } catch (err) {
    const name = (err as { name?: string })?.name ?? "";
    if (name === "PasswordException") {
      throw new ToolError(
        "This PDF is password-protected. Unlock it first (Unlock PDF tool), then convert it.",
      );
    }
    throw new ToolError(
      `This PDF could not be read for conversion. It may be corrupted or use unsupported features.${err instanceof Error ? ` (${err.message})` : ""}`,
    );
  } finally {
    try {
      await task.destroy();
    } catch {
      /* already destroyed */
    }
  }
}

/** Heuristic heading level from font size relative to the page's body text. */
export function headingLevelFor(fontSize: number, bodySize: number): number {
  if (bodySize <= 0 || fontSize <= 0) return 0;
  const ratio = fontSize / bodySize;
  if (ratio >= 1.6) return 1;
  if (ratio >= 1.3) return 2;
  if (ratio >= 1.1) return 3;
  return 0;
}