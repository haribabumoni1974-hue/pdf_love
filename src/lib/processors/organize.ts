import type { Processor } from "@/lib/types";
import { loadDoc, docFromPageIndices, derivedName } from "@/lib/pdf/pdf-ops";
import { parseOrderSpec } from "@/lib/pdf/page-selection";
import { verifyPdfOutput } from "@/lib/pdf/parse-pdf";

export const organizePdf: Processor = async ({ files, options }, _signal, onProgress) => {
  const f = files[0];
  const bytes = await f.file.arrayBuffer();
  const doc = await loadDoc(bytes, f.name);
  const total = doc.getPageCount();
  const order = parseOrderSpec(String(options.order ?? ""), total);

  onProgress({ stage: "processing", message: "Rearranging pages…" });
  const out = await docFromPageIndices(doc, order);
  const outBytes = await out.save({ useObjectStreams: true });
  const blob = new Blob([outBytes.buffer as ArrayBuffer], { type: "application/pdf" });
  onProgress({ stage: "finalizing", message: "Verifying the output…" });
  await verifyPdfOutput(blob, order.length);

  const removed = total - order.length;
  return {
    outputs: [{ name: derivedName(f.name, "organized"), blob, size: blob.size, kind: "pdf" }],
    summary: [{ label: "Pages", value: `${order.length} of ${total}` }],
    note: removed > 0 ? `Pages not listed in the order (${removed} total) were removed.` : undefined,
  };
};

export default organizePdf;