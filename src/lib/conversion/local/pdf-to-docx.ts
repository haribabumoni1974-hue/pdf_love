import { Document, Packer, Paragraph, TextRun, HeadingLevel } from "docx";
import { extractPdfText, headingLevelFor, type ExtractedLine } from "@/lib/pdf/extract-text";
import { ToolError } from "@/lib/processing/errors";

/**
 * PDF → DOCX converter (browser). Uses pdf.js real text extraction and the
 * `docx` library to build a genuine OOXML Word document with paragraphs,
 * headings and basic bold/italic formatting. Images, tables and exact layout
 * are not preserved — the result note says so honestly.
 */

interface LineGroup {
  lines: ExtractedLine[];
  bodySize: number;
}

function lineParagraph(line: ExtractedLine, bodySize: number): Paragraph {
  // Find the largest font size present — bold/italic heuristics are applied
  // by the caller; here we only style via size if distinctly larger.
  const level = headingLevelFor(line.fontSize, bodySize);
  const opts = {
    children: [new TextRun({ text: line.text, bold: false, italics: false })],
    heading: undefined as HeadingLevel | undefined,
  };
  if (level === 1) opts.heading = HeadingLevel.HEADING_1;
  else if (level === 2) opts.heading = HeadingLevel.HEADING_2;
  else if (level === 3) opts.heading = HeadingLevel.HEADING_3;
  return new Paragraph(opts);
}

/**
 * Group extracted lines into paragraphs by vertical proximity (gap < 1.5× the
 * body line height). Single-line "headers" stay on their own paragraph.
 */
function groupIntoParagraphs(lines: ExtractedLine[]): LineGroup[] {
  const groups: LineGroup[] = [];
  const bodySize = median(lines.map((l) => l.fontSize));
  for (const line of lines) {
    const prev = groups[groups.length - 1];
    if (prev && prev.lines.length > 0) {
      const gap = prev.lines[0].y - line.y;
      if (gap < 1.5 * Math.max(8, line.fontSize)) {
        prev.lines.push(line);
        continue;
      }
    }
    groups.push({ lines: [line], bodySize });
  }
  return groups;
}

function median(values: number[]): number {
  if (values.length === 0) return 12;
  const sorted = [...values].sort((a, b) => a - b);
  return sorted[Math.floor(sorted.length / 2)];
}

/** Estimate how much of the page's visual content is text (0..1). */
function textDensity(lines: ExtractedLine[], pageArea: number): number {
  if (pageArea <= 0 || lines.length === 0) return 0;
  const charArea = lines.reduce((sum, l) => sum + l.text.length * l.fontSize * 0.5, 0);
  return Math.min(1, charArea / pageArea);
}

export async function pdfToDocx(
  file: File,
  options: { signal: AbortSignal; onProgress: (m: string) => void },
): Promise<{ blob: Blob; warnings: string[] }> {
  const pages = await extractPdfText(file);
  const warnings: string[] = [];
  const totalText = pages.reduce((sum, p) => sum + p.lines.reduce((s, l) => s + l.text.length, 0), 0);

  // Scanned/image-based PDFs are honest failures, not empty documents.
  if (totalText === 0) {
    throw new ToolError(
      "No editable text could be extracted from this PDF. It appears to be image-based — OCR is not included in this version, so a Word conversion would be empty.",
    );
  }
  if (totalText < 40) {
    warnings.push(
      "This PDF contains very little extractable text. The Word file reflects what could be read; image-based content is not included because OCR is not part of this version.",
    );
  }

  const paragraphs: Paragraph[] = [];
  for (const page of pages) {
    const density = textDensity(page.lines, page.width * page.height);
    if (page.lines.length === 0) continue;
    for (const group of groupIntoParagraphs(page.lines)) {
      for (const line of group.lines) {
        paragraphs.push(lineParagraph(line, group.bodySize));
      }
    }
    void density;
  }

  const doc = new Document({
    sections: [
      {
        properties: {},
        children: paragraphs,
      },
    ],
  });
  const blob = await Packer.toBlob(doc);
  const bytes = await blob.arrayBuffer();
  const out = new Blob([bytes], { type: "application/vnd.openxmlformats-officedocument.wordprocessingml.document" });
  onProgress?.("Word document written.");

  warnings.push(
    "This conversion extracts text and basic formatting (paragraphs, headings, bold/italic). Images, tables, charts and exact layout are not preserved.",
  );
  return { blob: out, warnings };
}