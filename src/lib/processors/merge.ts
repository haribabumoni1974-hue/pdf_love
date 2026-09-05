import { PDFDocument } from "pdf-lib";
import type { Processor } from "@/lib/types";
import { verifyPdfOutput } from "@/lib/pdf/parse-pdf";
import { AbortError, ToolError, actionableEncryptedMessage } from "@/lib/processing/errors";
import { mergedOutputName } from "@/lib/files/names";

const throwIfAborted = (signal: AbortSignal) => {
  if (signal.aborted) throw new AbortError();
};

/**
 * Merge PDFs in the order given. Reads every input, copies every page into a
 * new document, saves, then re-opens the output with an independent parser
 * to verify it is valid and has the expected page count.
 */
export const mergePdfs: Processor = async (input, signal, onProgress) => {
  const total = input.files.length;
  if (total < 2) {
    throw new ToolError("Select at least two PDF files to merge.");
  }

  const docs: PDFDocument[] = [];
  try {
    // Phase 1: read + parse every input document (real, measurable work).
    for (let i = 0; i < total; i++) {
      throwIfAborted(signal);
      const f = input.files[i];
      onProgress({ stage: "processing", message: `Reading ${f.name}…`, current: i + 1, total });
      const bytes = await f.file.arrayBuffer();
      let doc: PDFDocument;
      try {
        doc = await PDFDocument.load(bytes, { ignoreEncryption: false });
      } catch (err) {
        const msg = err instanceof Error ? err.message : "";
        if (/encrypted/i.test(msg)) throw new ToolError(actionableEncryptedMessage(f.name));
        throw new ToolError(`"${f.name}" could not be read. It may be corrupted or unsupported.`);
      }
      docs.push(doc);
    }

    // Phase 2: copy pages in order.
    const out = await PDFDocument.create();
    let copied = 0;
    for (let i = 0; i < docs.length; i++) {
      throwIfAborted(signal);
      const pages = await out.copyPages(docs[i], docs[i].getPageIndices());
      for (const page of pages) out.addPage(page);
      copied += pages.length;
    }

    onProgress({ stage: "processing", message: "Writing the merged PDF…" });
    const bytes = await out.save({ useObjectStreams: true });
    const blob = new Blob([bytes.buffer as ArrayBuffer], { type: "application/pdf" });

    // Phase 3: independent output validation (re-parse the generated file).
    onProgress({ stage: "finalizing", message: "Verifying the output…" });
    await verifyPdfOutput(blob, copied);

    return {
      outputs: [{ name: mergedOutputName(), blob, size: blob.size, kind: "pdf" }],
      summary: [{ label: "Pages", value: String(copied) }],
    };
  } finally {
    // Release document references so buffers can be garbage-collected.
    docs.length = 0;
  }
};

export default mergePdfs;