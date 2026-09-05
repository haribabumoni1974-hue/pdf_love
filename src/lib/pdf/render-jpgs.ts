import { getDocument } from "pdfjs-dist";
import "@/lib/pdf/uint8array-polyfill";
import { ensurePdfWorker } from "@/lib/pdf/parse-pdf";
import { AbortError, ToolError } from "@/lib/processing/errors";
import type { OutputFile } from "@/lib/types";

/** Honest guard: rendering is memory-hungry, so cap pages and pixels per run. */
export const MAX_RENDER_PAGES = 50;
const MAX_PIXELS = 12_000_000; // ~12MP per canvas

export type RenderSetting = { quality: number; scale: number };

/** Resolve quality choice into render settings (pure, Node-testable). */
export function resolveRenderSetting(level: string): RenderSetting {
  switch (level) {
    case "low":
      return { quality: 0.6, scale: 1 };
    case "high":
      return { quality: 0.95, scale: 2 };
    case "medium":
    default:
      return { quality: 0.85, scale: 1.5 };
  }
}

function canvasToBlob(canvas: HTMLCanvasElement, type: string, quality: number): Promise<Blob> {
  return new Promise((resolve, reject) => {
    canvas.toBlob((b) => (b ? resolve(b) : reject(new Error("Canvas export failed."))), type, quality);
  });
}

const pad = (n: number) => String(n).padStart(3, "0");

/** Render every page of a PDF to JPEG blobs. Browser-only (needs canvas). */
export async function renderPdfToJpegs(
  blob: Blob,
  level: string,
  onPage: (current: number, total: number) => void,
  signal: AbortSignal,
): Promise<OutputFile[]> {
  ensurePdfWorker();
  const { quality, scale } = resolveRenderSetting(level);
  const data = new Uint8Array(await blob.arrayBuffer());
  const task = getDocument({ data, useWorkerFetch: false, disableAutoFetch: true });
  try {
    const doc = await task.promise;
    if (doc.numPages > MAX_RENDER_PAGES) {
      throw new ToolError(
        `This PDF has ${doc.numPages} pages, but the PDF to JPG tool renders up to ${MAX_RENDER_PAGES} pages per run to protect your browser's memory.`,
      );
    }
    const outputs: OutputFile[] = [];
    for (let i = 1; i <= doc.numPages; i++) {
      if (signal.aborted) throw new AbortError();
      onPage(i, doc.numPages);
      const page = await doc.getPage(i);
      const base = page.getViewport({ scale: 1 });
      const fit = Math.min(1, Math.sqrt(MAX_PIXELS / Math.max(1, base.width * base.height)));
      const viewport = page.getViewport({ scale: scale * fit });
      const canvas = document.createElement("canvas");
      canvas.width = Math.floor(viewport.width);
      canvas.height = Math.floor(viewport.height);
      const ctx = canvas.getContext("2d");
      if (!ctx) throw new ToolError("Your browser could not create a canvas to render the PDF.");
      ctx.fillStyle = "#ffffff";
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      const params = { canvasContext: ctx, viewport, background: "#ffffff" };
      await page.render(params as Parameters<typeof page.render>[0]).promise;
      const jpeg = await canvasToBlob(canvas, "image/jpeg", quality);
      outputs.push({ name: `page-${pad(i)}.jpg`, blob: jpeg, size: jpeg.size, kind: "image" });
      canvas.width = 0;
      canvas.height = 0;
    }
    return outputs;
  } catch (err) {
    if (err instanceof ToolError || err instanceof AbortError) throw err;
    throw new ToolError("A page could not be rendered. The PDF may contain unsupported content.");
  } finally {
    try {
      await task.destroy();
    } catch {
      /* already destroyed */
    }
  }
}