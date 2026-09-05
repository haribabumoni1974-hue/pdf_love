import type { Processor } from "@/lib/types";
import { loadDoc, derivedName } from "@/lib/pdf/pdf-ops";
import { verifyPdfOutput } from "@/lib/pdf/parse-pdf";
import { formatBytes, formatReduction } from "@/lib/files/format";

export const compressPdf: Processor = async ({ files }, _signal, onProgress) => {
  const f = files[0];
  const original = new Uint8Array(await f.file.arrayBuffer());

  onProgress({ stage: "processing", message: "Rebuilding the document…" });
  const doc = await loadDoc(original.buffer as ArrayBuffer, f.name);
  const rebuilt = await doc.save({ useObjectStreams: true });
  const rebuiltBlob = new Blob([rebuilt.buffer as ArrayBuffer], { type: "application/pdf" });

  const reduced = rebuilt.length < original.length;
  const outputBytes = reduced ? rebuilt : original;
  const blob = outputBytes === rebuilt ? rebuiltBlob : new Blob([outputBytes.buffer as ArrayBuffer], { type: "application/pdf" });

  onProgress({ stage: "finalizing", message: "Verifying the output…" });
  await verifyPdfOutput(blob, doc.getPageCount());

  const reductionLabel = reduced ? (formatReduction(original.length, rebuilt.length) ?? "<1%") : "None";
  // Always report the real numbers, even when no reduction was possible.
  const summary = [
    { label: "Before", value: formatBytes(original.length) },
    { label: "After", value: formatBytes(rebuilt.length) },
    { label: "Reduction", value: reductionLabel },
  ];
  const note = reduced
    ? `The rebuilt file was genuinely smaller (${reductionLabel} smaller). It is offered as your result.`
    : `The rebuilt file (${formatBytes(rebuilt.length)}) was not smaller than your original (${formatBytes(original.length)}), so the original is returned unchanged — no quality was lost and nothing was faked.`;

  return {
    outputs: [{ name: derivedName(f.name, "compressed"), blob, size: blob.size, kind: "pdf" }],
    summary,
    note,
  };
};

export default compressPdf;