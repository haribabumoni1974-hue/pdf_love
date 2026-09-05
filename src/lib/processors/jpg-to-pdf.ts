import { PDFDocument } from "pdf-lib";
import type { Processor } from "@/lib/types";
import { verifyPdfOutput } from "@/lib/pdf/parse-pdf";
import { ToolError } from "@/lib/processing/errors";
import { sanitizeBaseName } from "@/lib/files/names";

export const jpgToPdf: Processor = async ({ files }, _signal, onProgress) => {
  const out = await PDFDocument.create();
  let embedded = 0;
  for (let i = 0; i < files.length; i++) {
    const f = files[i];
    onProgress({ stage: "processing", message: `Embedding ${f.name}…`, current: i + 1, total: files.length });
    let image;
    try {
      image = await out.embedJpg(await f.file.arrayBuffer());
    } catch {
      throw new ToolError(`"${f.name}" is not a JPEG that could be embedded. It may be corrupt.`);
    }
    const page = out.addPage([image.width, image.height]);
    page.drawImage(image, { x: 0, y: 0, width: image.width, height: image.height });
    embedded++;
  }

  onProgress({ stage: "processing", message: "Writing the PDF…" });
  const bytes = await out.save({ useObjectStreams: true });
  const blob = new Blob([bytes.buffer as ArrayBuffer], { type: "application/pdf" });
  onProgress({ stage: "finalizing", message: "Verifying the output…" });
  await verifyPdfOutput(blob, embedded);

  const first = sanitizeBaseName(files[0]?.name ?? "images");
  return {
    outputs: [{ name: `${first}-images.pdf`, blob, size: blob.size, kind: "pdf" }],
    summary: [{ label: "Images", value: String(embedded) }],
  };
};

export default jpgToPdf;