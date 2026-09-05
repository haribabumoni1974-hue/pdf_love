import type { Processor, OutputFile } from "@/lib/types";
import { loadDoc, docFromPageIndices } from "@/lib/pdf/pdf-ops";
import { parsePageSpec } from "@/lib/pdf/page-selection";
import { verifyPdfOutput } from "@/lib/pdf/parse-pdf";
import { AbortError, ToolError } from "@/lib/processing/errors";

const MAX_PARTS = 100;

function groupRuns(sorted: number[]): number[][] {
  const groups: number[][] = [];
  for (const p of sorted) {
    const last = groups[groups.length - 1];
    if (last && p === last[last.length - 1] + 1) last.push(p);
    else groups.push([p]);
  }
  return groups;
}

function partName(group: number[]): string {
  const pad = (n: number) => String(n).padStart(3, "0");
  return group.length === 1 ? `split-page-${pad(group[0])}.pdf` : `split-${pad(group[0])}-${pad(group[group.length - 1])}.pdf`;
}

export const splitPdf: Processor = async ({ files, options }, signal, onProgress) => {
  const f = files[0];
  const bytes = await f.file.arrayBuffer();
  const doc = await loadDoc(bytes, f.name);
  const total = doc.getPageCount();

  const mode = options.mode === "pages" ? "pages" : "ranges";
  const rangesSpec = String(options.ranges ?? "").trim();
  if (mode === "ranges" && !rangesSpec) {
    throw new ToolError("Enter the page ranges to split into, e.g. 1-3, 5-8.");
  }
  const groups = mode === "pages" ? Array.from({ length: total }, (_, i) => [i + 1]) : groupRuns(parsePageSpec(rangesSpec, total));

  if (groups.length > MAX_PARTS) {
    throw new ToolError(
      `That would create ${groups.length} files. This tool splits into at most ${MAX_PARTS} parts — use wider ranges or fewer pages.`,
    );
  }
  const outputs: OutputFile[] = [];
  for (let g = 0; g < groups.length; g++) {
    if (signal.aborted) throw new AbortError();
    onProgress({ stage: "processing", message: `Writing part ${g + 1} of ${groups.length}…`, current: g + 1, total: groups.length });
    const part = await docFromPageIndices(doc, groups[g]);
    const partBytes = await part.save({ useObjectStreams: true });
    const blob = new Blob([partBytes.buffer as ArrayBuffer], { type: "application/pdf" });
    await verifyPdfOutput(blob, groups[g].length);
    outputs.push({ name: partName(groups[g]), blob, size: blob.size, kind: "pdf" });
  }
  return { outputs, summary: [{ label: "Parts", value: String(groups.length) }] };
};

export default splitPdf;