import { getDocument } from "pdfjs-dist";
import { ensurePdfWorker } from "@/lib/pdf/parse-pdf";
import { ToolError } from "@/lib/processing/errors";
import { writeXlsx, type SheetData } from "@/lib/conversion/office/xlsx-write";

/**
 * PDF → XLSX converter (browser). Real table extraction from the PDF's text
 * layer: lines are grouped by vertical position, words are separated into
 * columns at their horizontal positions, and the resulting grid is written as
 * a genuine OOXML workbook. Spreadsheets that are truly unstructured (no
 * recognisable grid) fail honestly instead of returning a fake workbook.
 */

interface Word {
  text: string;
  x: number;
  y: number;
  width: number;
}

interface Line {
  y: number;
  words: Word[];
}

/** Cluster word left-edges into column boundaries across the whole page. */
function columnBoundaries(allWords: Word[]): { x: number; width: number }[] {
  const starts = allWords.map((w) => w.x).sort((a, b) => a - b);
  if (starts.length === 0) return [];
  const cols: { x: number; width: number }[] = [];
  let current = { x: starts[0], width: 0 };
  for (let i = 1; i < starts.length; i++) {
    // New column when there's a gap larger than ~2.5× median word width.
    const gap = starts[i] - (current.x + current.width);
    const medianWidth = median(allWords.map((w) => w.width));
    if (gap > Math.max(8, medianWidth * 2.5)) {
      cols.push(current);
      current = { x: starts[i], width: 0 };
    } else {
      current.width = starts[i] - current.x;
    }
  }
  cols.push(current);
  return cols;
}

function median(values: number[]): number {
  if (values.length === 0) return 0;
  const sorted = [...values].sort((a, b) => a - b);
  return sorted[Math.floor(sorted.length / 2)];
}

/** Assign each word to a column by its left edge; return row cells in order. */
function toRow(line: Line, cols: { x: number; width: number }[]): (string | number | null)[] {
  const cells: (string | number | null)[] = cols.map(() => "");
  if (cols.length === 0) return [];
  for (const word of line.words) {
    let col = 0;
    for (let i = 0; i < cols.length; i++) {
      if (word.x >= cols[i].x) col = i;
    }
    const current = cells[col];
    cells[col] = current === "" ? word.text : `${current} ${word.text}`;
  }
  // Trim trailing empty cells but keep interior empties; convert numeric text.
  const trimmed = cells.slice(0, lastNonEmpty(cells) + 1);
  return trimmed.map((c) => {
    if (c === "") return null;
    const num = Number(c.replace(/,/g, "").replace(/%$/, "").trim());
    return Number.isFinite(num) && /^-?\d+(\.\d+)?%?$/.test(c.replace(/,/g, "").trim()) ? num : c;
  });
}

function lastNonEmpty(arr: (string | number | null)[]): number {
  for (let i = arr.length - 1; i >= 0; i--) {
    if (arr[i] !== "" && arr[i] !== null) return i;
  }
  return 0;
}

/** Extract words with positions from a rendered page. */
async function wordsOfPage(page: { getTextContent(): Promise<{ items: { str?: string; transform?: number[] }[] }> }): Promise<Word[]> {
  const content = await page.getTextContent();
  const words: Word[] = [];
  for (const item of content.items) {
    const str = item.str;
    if (!str) continue;
    const transform = item.transform ?? [1, 0, 0, 1, 0, 0];
    words.push({ text: str, x: transform[4], y: transform[5], width: str.length * Math.abs(transform[0]) });
  }
  return words;
}

export async function pdfToXlsx(
  file: File,
  opts: { signal: AbortSignal; onProgress: (m: string) => void },
): Promise<{ blob: Blob; warnings: string[] }> {
  ensurePdfWorker();
  const data = new Uint8Array(await file.arrayBuffer());
  const task = getDocument({ data, useWorkerFetch: false, disableAutoFetch: true });
  const sheets: SheetData[] = [];
  const warnings: string[] = [];

  try {
    const doc = await task.promise;
    const totalPages = doc.numPages;
    for (let p = 1; p <= totalPages; p++) {
      if (opts.signal.aborted) throw new DOMException("Aborted", "AbortError");
      opts.onProgress(`Reading page ${p} of ${totalPages}…`);
      const page = await doc.getPage(p);
      const words = await wordsOfPage(page);
      if (words.length === 0) continue; // image-only page: no text layer, nothing to extract

      const cols = columnBoundaries(words);
      if (cols.length < 2) continue; // single column — no tabular structure on this page

      // Group words into lines by y (tolerance ~ half average line height).
      const lines: Line[] = [];
      for (const w of words) {
        let placed = false;
        for (const line of lines) {
          if (Math.abs(line.y - w.y) < 2) {
            line.words.push(w);
            placed = true;
            break;
          }
        }
        if (!placed) lines.push({ y: w.y, words: [w] });
      }
      lines.sort((a, b) => b.y - a.y);

      const rows = lines.map((line) => toRow(line, cols));
      // Require at least 2 rows × 2 non-empty cells to count as a table.
      const nonEmpty = rows.filter((r) => r.some((c) => c !== null && c !== "")).length;
      if (nonEmpty < 2) continue;
      sheets.push({ name: `Sheet ${sheets.length + 1}`, rows });
      warnings.push(`Page ${p}: extracted as a worksheet with ${rows.length} rows.`);
    }
    await task.destroy();
  } catch (err) {
    if (err instanceof DOMException && err.name === "AbortError") throw err;
    throw new ToolError(
      `This PDF could not be read for spreadsheet extraction. It may be corrupted or use unsupported content.${err instanceof Error ? ` (${err.message})` : ""}`,
    );
  } finally {
    try {
      await task.destroy();
    } catch {
      /* already destroyed */
    }
  }

  if (sheets.length === 0) {
    throw new ToolError(
      "No table structure could be extracted from this PDF. Spreadsheet conversion reads the text layer and rebuilds rows/columns; scanned or image-based PDFs (without OCR) can't be converted to Excel.",
    );
  }

  opts.onProgress?.("Writing the workbook…");
  const blob = await writeXlsx(sheets);
  warnings.push(
    "Extraction is based on text positions in the PDF. Merged cells, styling and formulas from the original document cannot be reproduced.",
  );
  return { blob, warnings };
}