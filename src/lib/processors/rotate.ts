import type { Processor } from "@/lib/types";
import { loadDoc, rotateDoc, derivedName } from "@/lib/pdf/pdf-ops";
import { parsePageSpec } from "@/lib/pdf/page-selection";
import { verifyPdfOutput } from "@/lib/pdf/parse-pdf";
import { ToolError } from "@/lib/processing/errors";

const VALID_DEGREES = [90, 180, 270];

export const rotatePdf: Processor = async ({ files, options }, _signal, onProgress) => {
  const f = files[0];
  const deg = Number(options.degrees ?? 90);
  if (!VALID_DEGREES.includes(deg)) throw new ToolError("Choose a rotation of 90°, 180° or 270°.");

  const bytes = await f.file.arrayBuffer();
  const doc = await loadDoc(bytes, f.name);
  const total = doc.getPageCount();

  const spec = String(options.pages ?? "").trim();
  const indices = spec ? parsePageSpec(spec, total) : [];
  if (spec && indices.length === 0) throw new ToolError("No pages matched your selection.");

  onProgress({ stage: "processing", message: `Rotating ${indices.length || total} page${(indices.length || total) === 1 ? "" : "s"} by ${deg}°…` });
  const outBytes = await rotateDoc(doc, indices, deg);
  const blob = new Blob([outBytes.buffer as ArrayBuffer], { type: "application/pdf" });
  onProgress({ stage: "finalizing", message: "Verifying the output…" });
  await verifyPdfOutput(blob, total);

  return {
    outputs: [{ name: derivedName(f.name, "rotated"), blob, size: blob.size, kind: "pdf" }],
    summary: [
      { label: "Rotation", value: `${deg}°` },
      { label: "Rotated", value: indices.length ? `${indices.length} of ${total}` : `All ${total}` },
    ],
  };
};

export default rotatePdf;