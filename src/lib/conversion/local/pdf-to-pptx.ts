import PptxGenJS from "pptxgenjs";
import { extractPdfText, type ExtractedLine } from "@/lib/pdf/extract-text";
import { ToolError } from "@/lib/processing/errors";

/**
 * PDF → PPTX converter (browser). Each PDF page becomes a 16:9 slide whose
 * text lines are placed as text boxes scaled to the slide. This preserves
 * readable text and page structure; images, colors and exact positioning are
 * not reconstructed — the result note says so honestly.
 */

const SLIDE_W = 10; // inches, 16:9
const SLIDE_H = 5.625;

function fitLines(lines: ExtractedLine[], pageW: number, pageH: number): { x: number; y: number; text: string; size: number }[] {
  // Scale page coordinates into slide coordinates (preserve aspect).
  const scale = Math.min(SLIDE_W / pageW, SLIDE_H / pageH);
  const offsetX = (SLIDE_W - pageW * scale) / 2;
  const offsetY = (SLIDE_H - pageH * scale) / 2;
  return lines
    .sort((a, b) => (a.y === b.y ? a.x - b.x : b.y - a.y))
    .map((l) => ({
      x: offsetX + l.x * scale,
      y: offsetY + (pageH - l.y) * scale,
      text: l.text,
      size: Math.max(8, Math.min(28, l.fontSize * scale * 72 / 96 + 2)),
    }));
}

export async function pdfToPptx(
  file: File,
): Promise<{ blob: Blob; warnings: string[] }> {
  const pages = await extractPdfText(file);
  const totalText = pages.reduce((sum, p) => sum + p.lines.reduce((s, l) => s + l.text.length, 0), 0);
  if (totalText === 0) {
    throw new ToolError(
      "No editable text could be extracted from this PDF. It appears to be image-based — OCR is not included in this version, so a PowerPoint conversion would be empty.",
    );
  }

  const pptx = new PptxGenJS();
  pptx.layout = "LAYOUT_16x9";
  for (const page of pages) {
    const slide = pptx.addSlide();
    if (page.lines.length === 0) continue;
    const placed = fitLines(page.lines, page.width, page.height);
    for (const p of placed) {
      slide.addText(p.text, {
        x: p.x,
        y: p.y,
        w: 2.5,
        h: 0.35,
        fontSize: p.size,
        color: "333333",
        fill: { color: "FFFFFF" },
        align: "left",
        valign: "top",
        fontFace: "Calibri",
        shrinkText: true,
      });
    }
  }

  const blob = await pptx.write({ outputType: "blob" });
  const warnings: string[] = [
    "Each PDF page became one slide holding its readable text. Images, charts, colors and exact layout are not reconstructed — expect to restyle slides.",
    "If your PDF is image-based (no selectable text), those pages appear as empty slides because OCR is not included in this version.",
  ];
  return { blob: blob as Blob, warnings };
}