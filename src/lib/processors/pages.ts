import type { Processor } from "@/lib/types";
import { loadDoc, docFromPageIndices, derivedName } from "@/lib/pdf/pdf-ops";
import { parsePageSpec } from "@/lib/pdf/page-selection";
import { verifyPdfOutput } from "@/lib/pdf/parse-pdf";
import { ToolError } from "@/lib/processing/errors";

async function runSelection(
  f: { name: string; file: File },
  keep: number[],
  onProgress: Parameters<Processor>[2],
): Promise<{ blob: Blob; pages: number }> {
  const bytes = await f.file.arrayBuffer();
  const doc = await loadDoc(bytes, f.name);
  const out = await docFromPageIndices(doc, keep);
  onProgress({ stage: "processing", message: "Writing the new PDF…" });
  const outBytes = await out.save({ useObjectStreams: true });
  const blob = new Blob([outBytes.buffer as ArrayBuffer], { type: "application/pdf" });
  onProgress({ stage: "finalizing", message: "Verifying the output…" });
  await verifyPdfOutput(blob, keep.length);
  return { blob, pages: keep.length };
}

function allPages(total: number): number[] {
  return Array.from({ length: total }, (_, i) => i + 1);
}

export const extractPages: Processor = async ({ files, options }, _signal, onProgress) => {
  const f = files[0];
  const bytes = await f.file.arrayBuffer();
  const doc = await loadDoc(bytes, f.name);
  const total = doc.getPageCount();
  const keep = parsePageSpec(String(options.pages ?? ""), total);
  const { blob, pages } = await runSelection(f, keep, onProgress);
  return {
    outputs: [{ name: derivedName(f.name, "extracted-pages"), blob, size: blob.size, kind: "pdf" }],
    summary: [{ label: "Pages", value: `${pages} of ${total}` }],
  };
};

export const removePages: Processor = async ({ files, options }, _signal, onProgress) => {
  const f = files[0];
  const bytes = await f.file.arrayBuffer();
  const doc = await loadDoc(bytes, f.name);
  const total = doc.getPageCount();
  const remove = parsePageSpec(String(options.pages ?? ""), total);
  const removeSet = new Set(remove);
  const keep = allPages(total).filter((p) => !removeSet.has(p));
  if (keep.length === 0) {
    throw new ToolError("Removing those pages would delete the entire document — nothing was changed.");
  }
  const { blob, pages } = await runSelection(f, keep, onProgress);
  return {
    outputs: [{ name: derivedName(f.name, "removed-pages"), blob, size: blob.size, kind: "pdf" }],
    summary: [{ label: "Remaining", value: `${pages} of ${total}` }],
  };
};

const pageProcessors = { extractPages, removePages };
export default pageProcessors;