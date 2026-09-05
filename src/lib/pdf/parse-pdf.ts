import "@/lib/pdf/uint8array-polyfill";
import { getDocument, GlobalWorkerOptions } from "pdfjs-dist";
import type { PdfInfo } from "./types";

let workerConfigured = false;

// The pdf.js worker ships as a static, same-origin asset (public/vendor/),
// identical in dev and production. Keep it in sync with the pdfjs-dist
// version in package.json when upgrading.
const WORKER_PATH = "/vendor/pdf.worker.min.mjs";

function configureWorker() {
  if (workerConfigured || typeof window === "undefined") return;
  GlobalWorkerOptions.workerSrc = `${window.location.origin}${WORKER_PATH}`;
  workerConfigured = true;
}

/** Point pdf.js at its worker (safe to call repeatedly; no-op outside the browser). */
export function ensurePdfWorker(): void {
  configureWorker();
}

/**
 * Parse a PDF blob and report page count / encryption state.
 * Throws a readable message for PDFs that cannot be parsed.
 */
export async function inspectPdf(blob: Blob): Promise<PdfInfo> {
  configureWorker();
  const data = new Uint8Array(await blob.arrayBuffer());
  const task = getDocument({
    data,
    useWorkerFetch: false,
    disableAutoFetch: true,
  });
  try {
    const doc = await task.promise;
    const info = { pageCount: doc.numPages, encrypted: false };
    await task.destroy();
    return info;
  } catch (err) {
    const name = (err as { name?: string })?.name ?? "";
    if (name === "PasswordException") {
      return { pageCount: 0, encrypted: true };
    }
    const detail = err instanceof Error ? err.message : String(err);
    throw new Error(
      `This PDF could not be read. It may be corrupted or unsupported.${detail ? ` (${detail})` : ""}`,
    );
  } finally {
    try {
      await task.destroy();
    } catch {
      /* already destroyed */
    }
  }
}

/**
 * Independent output check: re-open a generated PDF with pdf.js and verify
 * it is parseable and has the expected number of pages.
 */
export async function verifyPdfOutput(blob: Blob, expectedPages?: number): Promise<PdfInfo> {
  const info = await inspectPdf(blob);
  if (info.encrypted) {
    throw new Error("The generated PDF is unexpectedly encrypted — the result could not be verified.");
  }
  if (expectedPages !== undefined && info.pageCount !== expectedPages) {
    throw new Error(
      `Output verification failed: expected ${expectedPages} pages but the generated file has ${info.pageCount}.`,
    );
  }
  return info;
}