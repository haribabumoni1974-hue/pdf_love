import { PDFDocument, degrees } from "pdf-lib";
import { ToolError, actionableEncryptedMessage } from "@/lib/processing/errors";
import { sanitizeBaseName } from "@/lib/files/names";

export async function loadDoc(bytes: ArrayBuffer, name: string): Promise<PDFDocument> {
  try {
    return await PDFDocument.load(bytes, { ignoreEncryption: false });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "";
    if (/encrypted/i.test(msg)) throw new ToolError(actionableEncryptedMessage(name));
    throw new ToolError(`"${name}" could not be read. It may be corrupted or unsupported.`);
  }
}

/** Copy the given 1-based source page indices into a brand-new PDF. */
export async function docFromPageIndices(source: PDFDocument, keep1: number[], doc?: PDFDocument): Promise<PDFDocument> {
  const out = doc ?? (await PDFDocument.create());
  const keep0 = keep1.map((p) => p - 1);
  const pages = await out.copyPages(source, keep0);
  for (const page of pages) out.addPage(page);
  return out;
}

export async function rotateDoc(source: PDFDocument, indices1: number[], deg: number): Promise<Uint8Array> {
  const idx = indices1.length === 0 ? source.getPageIndices() : indices1.map((p) => p - 1);
  for (const i of idx) source.getPage(i).setRotation(degrees(deg));
  return source.save({ useObjectStreams: true });
}

/** Base output name from a source filename, e.g. "annual-report.pdf" + "-rotated" -> "annual-report-rotated.pdf". */
export function derivedName(sourceName: string, suffix: string): string {
  return `${sanitizeBaseName(sourceName)}-${suffix}.pdf`;
}